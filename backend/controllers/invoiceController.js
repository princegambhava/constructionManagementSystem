const Invoice = require('../models/Invoice');

// @desc    Get invoices
// @route   GET /api/invoices
// @access  Private
const getInvoices = async (req, res) => {
  try {
    let query = {};

    // Contractor sees their own invoices
    if (req.user.role === 'contractor') {
      query.contractor = req.user._id;
    }
    // Site Manager / Admin see all
    
    const invoices = await Invoice.find(query)
      .populate('contractor', 'name email')
      .populate('project', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create invoice
// @route   POST /api/invoices
// @access  Private (Contractor)
const createInvoice = async (req, res) => {
  try {
    const { title, amount, description, base64Data, fileName, fileType, fileSize, projectId } = req.body;

    console.log('Creating invoice with Base64 data');

    if (!title || !amount) {
      return res.status(400).json({ message: 'Please provide title and amount' });
    }

    if (!base64Data) {
      return res.status(400).json({ message: 'Please upload a file (image or PDF)' });
    }

    // Validate Base64 data format
    if (!base64Data.startsWith('data:image/') && !base64Data.startsWith('data:application/pdf')) {
      return res.status(400).json({ message: 'Invalid file format. Only images and PDFs are allowed.' });
    }

    // Check file size (Base64 string length gives approximate size)
    const base64Size = Math.round((base64Data.length * 3) / 4); // Convert Base64 length to approximate bytes
    if (base64Size > 5 * 1024 * 1024) { // 5MB limit
      return res.status(400).json({ message: 'File size too large. Maximum size is 5MB.' });
    }

    const invoice = await Invoice.create({
      title,
      amount,
      description,
      base64Data,
      fileName: fileName || 'invoice',
      fileType: fileType || 'unknown',
      fileSize: fileSize || base64Size,
      project: projectId,
      contractor: req.user._id
    });

    console.log('Invoice created successfully with Base64 data');
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update invoice status
// @route   PUT /api/invoices/:id
// @access  Private (Site Manager/Admin)
const updateInvoiceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    invoice.status = status;
    await invoice.save();

    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getInvoices,
  createInvoice,
  updateInvoiceStatus
};
