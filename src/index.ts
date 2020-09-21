import express from "express";

const app = express();
const port = 3000;
app.get("/", (req, res) => {
  res.send({
    color: "Example color",
  });
});
app.listen(port, (): void => {
  return console.log(`server is listening on ${port}`);
});
