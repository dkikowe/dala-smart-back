import mongoose from "mongoose";

const farmSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: { type: String, required: true, trim: true },
    location: { type: String, trim: true, default: "" },
    imageUrl: { type: String, trim: true, default: "" },
  },
  { timestamps: true },
);

farmSchema.methods.toJSON = function toJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    location: this.location,
    imageUrl: this.imageUrl,
    createdAt: this.createdAt,
  };
};

export const Farm = mongoose.model("Farm", farmSchema);
