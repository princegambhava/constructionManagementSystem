const MaterialRequest = require("../models/MaterialRequest");
const Project = require("../models/Project");
const User = require("../models/User");
const Material = require("../models/Material");
// Create material request (Site Manager only)
const createMaterialRequest = async (req, res) => {
  try {
    console.log("createMaterialRequest called by:", req.user.role);
    console.log("Request body:", req.body);

    const {
      projectId,
      materialName,
      quantity,
      unit,
      description
    } = req.body;

    // Validate required fields
    if (!projectId || !materialName || !quantity || !unit) {
      return res.status(400).json({
        message: "Please provide all required fields: projectId, materialName, quantity, unit",
      });
    }

    // Verify project exists
    const projectDoc = await Project.findById(projectId);
    if (!projectDoc) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Create material request
    const materialRequest = new MaterialRequest({
      projectId: projectId,
      materialName: materialName,
      quantity: Number(quantity),
      unit,
      description: description || "",
      requestedBy: req.user._id,
      status: "pending",
    });

    await materialRequest.save();
    console.log("Material request saved:", materialRequest);

    // Populate request details
    await materialRequest.populate([
      { path: "projectId", select: "name projectId" },
      { path: "requestedBy", select: "name email" },
    ]);

    res.status(201).json({
      message: "Material request created successfully",
      materialRequest,
    });
  } catch (error) {
    console.error("Error creating material request:", error);
    res.status(500).json({ message: "Failed to create material request" });
  }
};

// Engineer approval/rejection
const engineerApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, comments } = req.body;

    if (typeof approved !== "boolean") {
      return res
        .status(400)
        .json({ message: "Approved field must be boolean" });
    }

    const materialRequest = await MaterialRequest.findById(id);
    if (!materialRequest) {
      return res.status(404).json({ message: "Material request not found" });
    }

    // Check if request is in pending status
    if (materialRequest.status !== "pending") {
      return res.status(400).json({
        message: "Material request can only be approved/rejected when status is pending",
      });
    }

    // Update engineer approval
    materialRequest.engineerApprovedBy = req.user._id;
    materialRequest.engineerApprovedAt = new Date();
    materialRequest.engineerRemarks = comments || "";

    // Update status based on engineer decision
    materialRequest.status = approved ? "engineer-approved" : "engineer-rejected";

    await materialRequest.save();

    // Populate response
    await materialRequest.populate([
      { path: "projectId", select: "name projectId" },
      { path: "requestedBy", select: "name email" },
      { path: "engineerApprovedBy", select: "name email" },
    ]);

    res.status(200).json({
      message: `Material request ${approved ? "approved" : "rejected"} by engineer`,
      materialRequest,
    });
  } catch (error) {
    console.error("Error in engineer approval:", error);
    res.status(500).json({ message: "Failed to process engineer approval" });
  }
};

// Contractor approval/rejection
const contractorApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, comments } = req.body;

    if (typeof approved !== "boolean") {
      return res
        .status(400)
        .json({ message: "Approved field must be boolean" });
    }

    const materialRequest = await MaterialRequest.findById(id);
    if (!materialRequest) {
      return res.status(404).json({ message: "Material request not found" });
    }

    // Check if request is approved by engineer
    if (materialRequest.status !== "engineer-approved") {
      return res.status(400).json({
        message: "Material request can only be approved/rejected by contractor after engineer approval",
      });
    }

    // Update contractor approval
    materialRequest.contractorApprovedBy = req.user._id;
    materialRequest.contractorApprovedAt = new Date();
    materialRequest.contractorRemarks = comments || "";

    // Update status based on contractor decision
    materialRequest.status = approved ? "contractor-approved" : "contractor-rejected";

    await materialRequest.save();

    // Populate response
    await materialRequest.populate([
      { path: "projectId", select: "name projectId" },
      { path: "requestedBy", select: "name email" },
      { path: "engineerApprovedBy", select: "name email" },
      { path: "contractorApprovedBy", select: "name email" },
    ]);

    res.status(200).json({
      message: `Material request ${approved ? "approved" : "rejected"} by contractor`,
      materialRequest,
    });
  } catch (error) {
    console.error("Error in contractor approval:", error);
    res.status(500).json({ message: "Failed to process contractor approval" });
  }
};

// Get all material requests (Admin, Engineer, Contractor)
const getAllMaterialRequests = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // ✅ Declare FIRST
    let filter = {};

    console.log("🔍 Role:", req.user.role);

    if (req.user.role === "admin") {
      filter = {};
    }

    else if (req.user.role === "site_manager") {
      filter = { requestedBy: req.user._id };
    }

    else if (req.user.role === "engineer") {
      filter = {
        status: "pending"
      };
    }

    else if (req.user.role === "contractor") {
      filter = {
        status: "engineer_approved"
      };
    }

    // Override with query parameters if provided
    if (req.query.project) {
      filter.project = req.query.project;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    console.log("🔍 Filter:", filter);

    const total = await MaterialRequest.countDocuments(filter);

    const requests = await MaterialRequest.find(filter)
      .populate("project", "name")
      .populate("requestedBy", "name email")
      .populate("approvedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    console.log("🔍 Requests found:", requests.length);

    res.status(200).json({
      data: requests,
      pagination: {
        page,
        totalPages: Math.ceil(total / limit) || 1,
        total,
      },
    });
  } catch (error) {
    console.error(
      "Error fetching material requests:",
      error
    );

    res.status(500).json({
      message:
        error.message,
    });
  }
};

// Get material requests for a specific project
const getProjectMaterialRequests = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status } = req.query;

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Build filter
    const filter = { projectId };
    if (status) filter.status = status;

    const materialRequests = await MaterialRequest.find(filter)
      .populate("projectId", "name projectId")
      .populate("requestedBy", "name email")
      .populate("engineerApprovedBy", "name email")
      .populate("contractorApprovedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      materialRequests,
      project: {
        id: project.id,
        name: project.name,
        projectId: project.projectId,
      },
      count: materialRequests.length,
    });
  } catch (error) {
    console.error("Error fetching project material requests:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch project material requests" });
  }
};

// Get material requests created by current user (Site Manager)
const getMyMaterialRequests = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = { requestedBy: req.user._id };
    if (status) filter.status = status;

    const materialRequests = await MaterialRequest.find(filter)
      .populate("projectId", "name projectId")
      .populate("requestedBy", "name email")
      .populate("engineerApprovedBy", "name email")
      .populate("contractorApprovedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      materialRequests,
      count: materialRequests.length,
    });
  } catch (error) {
    console.error("Error fetching my material requests:", error);
    res.status(500).json({ message: "Failed to fetch material requests" });
  }
};

// Get material request by ID
const getMaterialRequestById = async (req, res) => {
  try {
    const materialRequest = await MaterialRequest.findById(req.params.id)
      .populate("projectId", "name projectId")
      .populate("requestedBy", "name email")
      .populate("engineerApprovedBy", "name email")
      .populate("contractorApprovedBy", "name email");

    if (!materialRequest) {
      return res.status(404).json({ message: "Material request not found" });
    }

    res.status(200).json({
      materialRequest,
    });
  } catch (error) {
    console.error("Error fetching material request:", error);
    res.status(500).json({ message: "Failed to fetch material request" });
  }
};

// Legacy functions for backward compatibility
const getMaterialRequests = async (req, res) => {
  return getAllMaterialRequests(req, res);
};

const updateMaterialRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // For backward compatibility, map old status to new workflow
    const materialRequest = await MaterialRequest.findById(id);
    if (!materialRequest) {
      return res.status(404).json({ message: "Material request not found" });
    }

    materialRequest.status = status;
    await materialRequest.save();

    await materialRequest.populate([
      { path: "projectId", select: "name projectId" },
      { path: "requestedBy", select: "name email" },
      { path: "technicalApprovedBy", select: "name email", model: "User" },
      {
        path: "finalApprovedBy",
        select: "name email",
        model: "User",
      },
    ]);

    res.status(200).json({
      message: "Material request updated successfully",
      materialRequest,
    });
  } catch (error) {
    console.error("Error updating material request:", error);
    res.status(500).json({ message: "Failed to update material request" });
  }
};

const getMaterialRequestsForContractor = async (req, res) => {
  try {
    const materialRequests = await MaterialRequest.find({
      status: { $in: ["engineer_approved", "approved", "rejected"] },
    })
      .populate([
        { path: "projectId", select: "name projectId" },
        { path: "requestedBy", select: "name email" },
        { path: "technicalApprovedBy", select: "name email", model: "User" },
        {
          path: "finalApprovedBy",
          select: "name email",
          model: "User",
        },
      ])
      .sort({ createdAt: -1 });

    res.status(200).json({
      data: materialRequests,
      pagination: {
        page: 1,
        limit: materialRequests.length,
        total: materialRequests.length,
        totalPages: 1,
      },
    });
  } catch (error) {
    console.error("Error fetching contractor material requests:", error);
    res.status(500).json({ message: "Failed to fetch material requests" });
  }
};

// Mark material as completed/issued
const completeMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    const materialRequest = await MaterialRequest.findById(id);
    if (!materialRequest) {
      return res.status(404).json({ message: "Material request not found" });
    }

    // Check if request is approved
    if (materialRequest.status !== "Approved") {
      return res.status(400).json({
        message:
          "Material can only be marked as completed when status is Approved",
      });
    }

    // Update status to completed
    materialRequest.status = "Completed";
    await materialRequest.save();

    // Populate response
    await materialRequest.populate([
      { path: "projectId", select: "name projectId" },
      { path: "requestedBy", select: "name email" },
      { path: "technicalApprovedBy", select: "name email" },
      { path: "finalApprovedBy", select: "name email" },
    ]);

    res.status(200).json({
      message: "Material marked as completed/issued",
      materialRequest,
    });
  } catch (error) {
    console.error("Error completing material:", error);
    res.status(500).json({ message: "Failed to complete material" });
  }
};

const deleteMaterialRequest = async (req, res) => {
  try {
    const materialRequest = await MaterialRequest.findById(req.params.id);
    if (!materialRequest) {
      return res.status(404).json({ message: "Material request not found" });
    }

    await MaterialRequest.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Material request deleted successfully" });
  } catch (error) {
    console.error("Error deleting material request:", error);
    res.status(500).json({ message: "Failed to delete material request" });
  }
};

module.exports = {
  createMaterialRequest,
  engineerApproval,
  contractorApproval,
  completeMaterial,
  getAllMaterialRequests,
  getProjectMaterialRequests,
  getMyMaterialRequests,
  getMaterialRequestById,
  // Legacy functions
  getMaterialRequests,
  updateMaterialRequestStatus,
  getMaterialRequestsForContractor,
  deleteMaterialRequest,
};
