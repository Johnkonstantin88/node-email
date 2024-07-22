const { Schema, model } = require("mongoose");
const Joi = require("joi");
const { handleMongooseError } = require("../helpers");

const contactSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Set name for contact"],
    },
    email: {
      type: String,
    },
    phone: {
      type: String,
    },
    favorite: {
      type: Boolean,
      default: false,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
  },
  { versionKey: false, timestamps: true }
);

contactSchema.post("save", handleMongooseError);

const createContactSchema = Joi.object({
  name: Joi.string().required().messages({
    "any.required": `Name field is required`,
  }),
  email: Joi.string().required().messages({
    "any.required": `Email field is required`,
  }),
  phone: Joi.string().required().messages({
    "any.required": `Phone field is required`,
  }),
});

const updateContactSchema = Joi.object({
  name: Joi.string().required().messages({
    "any.required": `Name field is required`,
  }),
  email: Joi.string().required().messages({
    "any.required": `Email field is required`,
  }),
  phone: Joi.string().required().messages({
    "any.required": `Phone field is required`,
  }),
});

const updateFavoriteContactSchema = Joi.object({
  favorite: Joi.boolean().required().messages({
    "any.required": `Favorite field is required`,
  }),
});

const Contact = model("contact", contactSchema);

const schemas = {
  createContactSchema,
  updateContactSchema,
  updateFavoriteContactSchema,
};

module.exports = {
  Contact,
  schemas,
};
