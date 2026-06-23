import mongoose from "mongoose";

const animalSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    idCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    chipCode: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      default: "КРС",
      enum: ["КРС", "МРС", "Лошади", "Другое"],
    },
    breed: {
      type: String,
      trim: true,
      default: "",
    },
    color: {
      type: String,
      trim: true,
      default: "",
    },
    gender: {
      type: String,
      enum: ["Самка", "Самец", "Не указано"],
      default: "Не указано",
    },
    birthDate: Date,
    weightKg: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: ["На ферме", "На выгуле", "Не зашел"],
      default: "На ферме",
    },
  },
  { timestamps: true },
);

animalSchema.index({ ownerId: 1, idCode: 1 }, { unique: true });
animalSchema.index({ ownerId: 1, chipCode: 1 }, { unique: true });

animalSchema.methods.toJSON = function toJSON() {
  return {
    id: this._id.toString(),
    idCode: this.idCode,
    chipCode: this.chipCode,
    type: this.type,
    breed: this.breed,
    color: this.color,
    gender: this.gender,
    birthDate: this.birthDate,
    weightKg: this.weightKg,
    status: this.status,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const Animal = mongoose.model("Animal", animalSchema);
