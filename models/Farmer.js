import mongoose from "mongoose";

const farmerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      default: "Arish"
    },
    phone: {
      type: String,
      default: ""
    },
    email: {
      type: String,
      default: ""
    },
    farmName: {
      type: String,
      default: ""
    },
    location: {
      type: String,
      default: ""
    },
    profilePhoto: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

const Farmer =
  mongoose.models.Farmer ||
  mongoose.model("Farmer", farmerSchema);

export default Farmer;