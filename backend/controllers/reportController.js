const Report = require('../models/report');
const Document = require('../models/document'); // do Thành viên 2 tạo

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
    const { status } = req.body;

    if (!['resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ message: 'Không tìm thấy báo cáo' });
    }

    report.status = status;
    report.handledBy = req.user._id;
    report.resolvedAt = new Date();
    await report.save();

    res.json({ report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi cập nhật báo cáo' });
  }
};
