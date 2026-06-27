import mongoose from "mongoose";

/**
 * A named breeding group (табун/косяк for horses, group for cattle).
 * Holds the sires (males) assigned to the group so they can be
 * auto-filled when the group is picked again later.
 */
const breedingGroupSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["Верблюд", "Лошадь", "Корова", "Овца", "Коза"],
      required: true,
    },
    name: {
      type: String,
      trim: true,
      required: true,
    },
    maleIdCodes: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

// One group name per owner+type.
breedingGroupSchema.index({ ownerId: 1, type: 1, name: 1 }, { unique: true });

breedingGroupSchema.methods.toJSON = function toJSON() {
  return {
    id: this._id.toString(),
    type: this.type,
    name: this.name,
    maleIdCodes: this.maleIdCodes,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const BreedingGroup = mongoose.model(
  "BreedingGroup",
  breedingGroupSchema,
);
