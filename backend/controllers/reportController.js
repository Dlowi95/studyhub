const Report = require('../models/report');
const Document = require('../models/Document');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const { removeDocument } = require('../utils/removeDocument');
const { notifyDocumentStatus } = require('../utils/notificationService');
const {
  notifyReportStatus,
  notifyReportSubmitted,
} = require('../utils/notificationService');
const { recordAuditEvent } = require('../utils/auditLog');

// POST /api/reports
exports.createReport = async (req, res) => {
  try {
    const { documentId, reason } = req.body;
    const reporterId = req.user._id;

    if (!mongoose.isObjectIdOrHexString(documentId) || typeof reason !== 'string' || !reason.trim() || reason.trim().length > 2000) {
      return res.status(400).json({ message: 'Cần mã tài liệu hợp lệ và lý do từ 1 đến 2.000 ký tự' });
    }

    const document = await Document.findById(documentId);
    if (!document || document.status !== 'approved') {
      return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
    }

    // Yêu cầu 5: Chặn báo cáo trùng lặp cùng 1 tài liệu
    const existingReport = await Report.findOne({
      documentId,
      reporterId,
    });

    if (existingReport) {
      if (existingReport.status === 'pending') {
        return res.status(400).json({
          message: 'Bạn đã gửi báo cáo cho tài liệu này rồi và đang chờ quản trị viên xử lý.',
          report: existingReport,
        });
      } else {
        return res.status(400).json({
          message: 'Bạn đã báo cáo tài liệu này trước đó.',
          report: existingReport,
        });
      }
    }

    const report = await Report.create({
      documentId,
      reporterId,
      reason: reason.trim(),
      documentTitle: document.title,
    });

    await notifyReportSubmitted(report, document).catch((notificationError) => {
      console.error('Không thể tạo thông báo báo cáo mới:', notificationError.message);
    });

    res.status(201).json({ report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi gửi báo cáo' });
  }
};

// GET /api/reports/check/:documentId (Kiểm tra xem người dùng hiện tại đã báo cáo tài liệu chưa)
exports.checkReportStatus = async (req, res) => {
  try {
    const { documentId } = req.params;
    if (!mongoose.isObjectIdOrHexString(documentId)) return res.status(400).json({ message: 'Mã tài liệu không hợp lệ' });
    const reporterId = req.user._id;

    const existingReport = await Report.findOne({
      documentId,
      reporterId,
    }).sort({ createdAt: -1 });

    if (existingReport) {
      return res.json({
        hasReported: true,
        status: existingReport.status,
        reportId: existingReport._id,
        createdAt: existingReport.createdAt,
      });
    }

    res.json({
      hasReported: false,
      status: null,
      reportId: null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi kiểm tra trạng thái báo cáo' });
  }
};

// GET /api/reports/my  (người dùng xem báo cáo của chính mình)
exports.getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ reporterId: req.user._id })
      .populate('documentId', 'title')
      .sort({ createdAt: -1 });

    res.json({ reports });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi lấy báo cáo của bạn' });
  }
};

// GET /api/reports  (chỉ admin — dùng middleware authorizeRoles('admin'))
exports.getAllReports = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const reports = await Report.find(filter)
      .populate('documentId', 'title fileUrl')
      .populate('reporterId', 'name email')
      .populate('handledBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ reports });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách báo cáo' });
  }
};

// PUT /api/reports/:id/status  (chỉ admin)
exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, adminFeedback } = req.body;
    const actions = { resolve_reject: 'resolved', resolve_delete: 'resolved', dismiss: 'dismissed' };
    if (!mongoose.isObjectIdOrHexString(id)) return res.status(400).json({ message: 'Mã báo cáo không hợp lệ' });
    if (action !== undefined && !Object.hasOwn(actions, action)) {
      return res.status(400).json({ message: 'Thao tác xử lý không hợp lệ' });
    }
    if (action === 'resolve_delete' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Chỉ quản trị viên được xóa tài liệu' });
    }
    if (adminFeedback !== undefined && (typeof adminFeedback !== 'string' || adminFeedback.length > 2000)) {
      return res.status(400).json({ message: 'Phản hồi tối đa 2.000 ký tự' });
    }
    const status = action ? actions[action] : req.body.status;

    if (!['pending', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }

    const report = await Report.findById(id).populate('documentId', 'title');
    if (!report) {
      return res.status(404).json({ message: 'Không tìm thấy báo cáo' });
    }

    const previousStatus = report.status;
    const documentId = report.documentId?._id;
    if (documentId && (action === 'resolve_reject' || action === 'resolve_delete')) {
      const document = await Document.findById(documentId);
      if (!document) return res.status(409).json({ message: 'Tài liệu đã thay đổi, vui lòng tải lại báo cáo' });
      report.documentTitle = document.title;
      if (action === 'resolve_delete') {
        await removeDocument(document);
        report.documentId = null;
      } else {
        const previousDocumentStatus = document.status;
        document.status = 'rejected';
        document.moderationNote = typeof adminFeedback === 'string' && adminFeedback.trim() ? adminFeedback.trim() : report.reason;
        await document.save();
        if (previousDocumentStatus !== 'rejected') await notifyDocumentStatus(document, 'rejected').catch((error) => {
          console.error('Không thể tạo thông báo từ chối tài liệu:', error.message);
        });
      }
    }
    report.status = status;
    report.handledBy = status === 'pending' ? null : req.user._id;
    report.resolvedAt = status === 'pending' ? null : new Date();
    if (typeof adminFeedback === 'string') {
      report.adminFeedback = adminFeedback.trim();
    }
    await report.save();

    if (previousStatus !== status || action) {
      await recordAuditEvent({
        actor: req.user,
        action: 'report_status_changed',
        entityType: 'Report',
        entityId: report._id,
        reportId: report._id,
        documentId: documentId || null,
        previousStatus,
        nextStatus: status,
        reason: typeof adminFeedback === 'string' ? adminFeedback : '',
        metadata: { action: action || 'status_update', documentTitle: report.documentTitle },
      });
    }

    if (previousStatus !== status && (status === 'resolved' || status === 'dismissed')) {
      await notifyReportStatus(report).catch((notificationError) => {
        console.error('Không thể tạo thông báo trạng thái báo cáo:', notificationError.message);
      });
    }

    res.json({ report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi cập nhật báo cáo' });
  }
};

// DELETE /api/reports/:id  (chỉ admin)
exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Không tìm thấy báo cáo' });
    }

    await Notification.deleteMany({ relatedReportId: report._id });

    res.json({ message: 'Đã xóa báo cáo' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi xóa báo cáo' });
  }
};
