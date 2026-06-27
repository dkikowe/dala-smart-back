import mongoose from "mongoose";

const healthRecordSchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      enum: ["vaccination", "treatment"],
      required: true,
    },
    title: {
      type: String,
      trim: true,
      required: true,
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

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
      default: "Корова",
      enum: ["Верблюд", "Лошадь", "Корова", "Овца", "Коза"],
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
    motherIdCode: {
      type: String,
      trim: true,
      default: "",
    },
    fatherIdCode: {
      type: String,
      trim: true,
      default: "",
    },
    breedingGroup: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    breedingGroupName: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    breedingMaleIdCodes: {
      type: [String],
      default: [],
    },
    ageGroup: {
      type: String,
      trim: true,
      default: "",
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
    lifecycleStatus: {
      type: String,
      enum: ["on_farm", "transferred", "dead", "sold_alive", "slaughtered", "archived"],
      default: "on_farm",
      index: true,
    },
    departureReason: {
      type: String,
      trim: true,
      default: "",
    },
    departureComment: {
      type: String,
      trim: true,
      default: "",
    },
    departureDate: Date,
    newOwner: {
      type: String,
      trim: true,
      default: "",
    },
    healthRecords: {
      type: [healthRecordSchema],
      default: [],
    },
    photoUrl: {
      type: String,
      default: "",
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
    motherIdCode: this.motherIdCode,
    fatherIdCode: this.fatherIdCode,
    breedingGroup: this.breedingGroup,
    breedingGroupName: this.breedingGroupName,
    breedingMaleIdCodes: this.breedingMaleIdCodes,
    ageGroup: this.ageGroup,
    birthDate: this.birthDate,
    weightKg: this.weightKg,
    status: this.status,
    lifecycleStatus: this.lifecycleStatus,
    departureReason: this.departureReason,
    departureComment: this.departureComment,
    departureDate: this.departureDate,
    newOwner: this.newOwner,
    healthRecords: (this.healthRecords ?? []).map((record) => ({
      id: record._id.toString(),
      kind: record.kind,
      title: record.title,
      note: record.note,
      date: record.date,
      createdAt: record.createdAt,
    })),
    photoUrl: this.photoUrl || "",
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const Animal = mongoose.model("Animal", animalSchema);
