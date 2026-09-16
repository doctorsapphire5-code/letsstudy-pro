if (require.main === module) {
  const PORT = process.env.PORT || 3000;

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LetsStudy Pro Payment API running on port ${PORT}`);
  });
}