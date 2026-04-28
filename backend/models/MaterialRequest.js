const mongoose = require("mongoose");

const materialRequestSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project ID is required"]
    },

    materialName: {
      type: String,
      required: [true, "Material name is required"],
      trim: true
    },

    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"]
    },

    unit: {
      type: String,
      required: [true, "Unit is required"],
      enum: [
        "kg",
        "tons",
        "pieces",
        "bags",
        "liters",
        "meters",
        "feet",
        "cubic_meters",
        "square_meters",
        "boxes",
        "bundles",
        "other"
      ],
      default: "pieces"
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true
    },

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Requested by is required"]
    },

    status: {
      type: String,
      enum: [
        "submitted",
        "engineer-approved",
        "engineer-rejected",
        "contractor-approved",
        "contractor-rejected",
        "purchased",
        "delivered"
      ],
      default: "submitted"
    },

    // Engineer approval
    engineerApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    engineerApprovedAt: {
      type: Date
    },

    engineerRemarks: {
      type: String,
      trim: true
    },

    // Contractor approval
    contractorApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    contractorApprovedAt: {
      type: Date
    },

    contractorRemarks: {
      type: String,
      trim: true
    },

    requestDate: {
      type: Date,
      default: Date.now
    },

    // Optional / legacy fields
    title: {
      type: String,
      trim: true
    },

    materialType: {
      type: String,
      enum: [
        "raw_materials",
        "equipment",
        "tools",
        "safety",
        "electrical",
        "plumbing",
        "finishing"
      ]
    },

    urgency: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium"
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project"
    },

    siteManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    assignedContractor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    estimatedDelivery: {
      type: Date
    },

    actualDelivery: {
      type: Date
    },

    notes: {
      type: String,
      trim: true
    },

    budget: {
      type: Number
    },

    actualCost: {
      type: Number
    }
  },
  { timestamps: true }
);

// Indexes for performance
materialRequestSchema.index({ projectId: 1, status: 1 });
materialRequestSchema.index({ requestedBy: 1 });
materialRequestSchema.index({ status: 1 });

module.exports = mongoose.model("MaterialRequest", materialRequestSchema);