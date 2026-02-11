module.exports = function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });

    if (error) {
      return next({
        status: 400,
        message: "Validation error",
        details: error.details.map((d) => d.message),
      });
    }

    next();
  };
};
