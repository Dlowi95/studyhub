const Report = require('../models/report');
const Document = require('../models/Document');
const Notification = require('../models/Notification');

// POST /api/reports
exports.createReport = async (req, res) => {
  try {
    const { documentId, reason } = req.body;
    const reporterId = req.user._id;

    if (!documentId || !reason) {
      return res.status(400).json({ message: 'Thiếu documentId hoặc lý do báo cáo' });
    }

    const document = await Document.findById(documentId);
    if (!document) {
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
      reason,
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
    const { status, adminFeedback } = req.body;

    if (!['pending', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }

    const report = await Report.findById(id).populate('documentId', 'title');
    if (!report) {
      return res.status(404).json({ message: 'Không tìm thấy báo cáo' });
    }

    report.status = status;
    report.handledBy = status === 'pending' ? null : req.user._id;
    report.resolvedAt = status === 'pending' ? null : new Date();
    if (typeof adminFeedback === 'string') {
      report.adminFeedback = adminFeedback.trim();
    }
    await report.save();

    // Yêu cầu 4: Thông báo khi báo cáo được xử lý
    if (status === 'resolved' || status === 'dismissed') {
      try {
        const isResolved = status === 'resolved';
        const docTitle = report.documentId?.title || 'Tài liệu';
        const feedbackText = report.adminFeedback ? ` Ghi chú từ quản trị viên: "${report.adminFeedback}".` : '';

        await Notification.create({
          recipient: report.reporterId,
          type: isResolved ? 'report_resolved' : 'report_dismissed',
          title: isResolved ? 'Báo cáo vi phạm đã được xử lý' : 'Báo cáo vi phạm đã được xem xét',
          message: isResolved
            ? `Báo cáo của bạn về tài liệu "${docTitle}" đã được chấp thuận và xử lý.${feedbackText}`
            : `Báo cáo của bạn về tài liệu "${docTitle}" đã được xem xét và bỏ qua.${feedbackText}`,
          link: '/my-reports',
          relatedReportId: report._id,
        });
      } catch (notifErr) {
        console.error('Lỗi khi tạo thông báo cho người dùng:', notifErr);
      }
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

    res.json({ message: 'Đã xóa báo cáo' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi xóa báo cáo' });
  }
};
