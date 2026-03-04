const Jimp = require("jimp");
async function run() {
  console.log("Reading reactsbrand.png...");
  const img = await Jimp.read("assets/images/reactsbrand.png");
  const w = img.bitmap.width;
  const h = img.bitmap.height;
  const size = Math.max(w, h);
  console.log(`Dimensions: ${w}x${h} -> ${size}x${size}`);
  if (w === size && h === size) return console.log("Already square");

  new Jimp(size, size, 0x00000000, (err, bg) => {
    bg.composite(img, Math.floor((size - w) / 2), Math.floor((size - h) / 2));
    bg.write("assets/images/reactsbrand.png", (err) => {
      if (err) console.error(err);
      else console.log("Done. File created.");
    });
  });
}
run().catch(console.error);
