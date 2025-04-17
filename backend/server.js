const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sharp = require('sharp');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath('C:/ffmpeg-7.0.2-essentials_build/bin/ffmpeg.exe');
const cv = require('opencv4nodejs-prebuilt-install');
const fs = require('fs');
const path = require('path');
const { createWorker } = require('tesseract.js');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use('/img', express.static('./img'));

const storage = multer.diskStorage({
    destination: (_, file, cb) => {
      if (file.mimetype.startsWith('image/')) cb(null, './img/');
      else {
        cb(null, './video/');
      }
    },
    filename: (_, file, cb) => {
      if (file.mimetype.startsWith('image/')) cb(null, 'original.jpg');
      else {
        cb(null, 'original.mp4');
      }
    }
});

const upload = multer({ storage: storage });

function getSign(dX, dY) {
    let signX, signY
    if (dX < 0) signX = -1
    else if ( dX > 0) signX = 1
    else signX = 0
    if (dY < 0) signY = -1
    else if ( dY > 0) signY = 1
    else signY = 0
    return {signX, signY}
}

class Line {
    constructor(X, Y) {
        this.k = Y/X
    }

    point({x, y}) {
        if (x) return x * this.k
        else return y / this.k
    }
}

app.post('/drowpoint', function(req, res) {
    res.set({
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "http://localhost:3000",
    });

    let {points, size, x, y, amount} = req.body;
    amount = Math.floor(amount);
    const from = {x: Math.floor((points[0].x - x) / size), y: Math.floor((points[0].y - y) / size)}
    const to = {x: Math.floor((points[1].x - x) / size), y: Math.floor((points[1].y - y) / size)}
    console.log({to, from});
    let ids = [from.x + from.y * amount];
    const dX = points[1].x - points[0].x;
    const dY = points[1].y - points[0].y;
    const {signX, signY} = getSign(dX, dY);
    console.log(dX, dY);
    console.log(signX, signY);
    const line = new Line(dX, dY);
    if (Math.abs(dX) > Math.abs(dY)) {
        for (let i = 0; i < Math.abs(to.x - from.x); i++){
            ids.push(from.x + signX * (1 + i) + Math.floor((points[0].y + line.point({x: signX * (i * size + size / 2)}) - y) / size) * amount);
        }
    } else if (Math.abs(dX) < Math.abs(dY)) {
        for (let i = 0; i < Math.abs(to.y - from.y); i++){
            console.log({y: (from.y + signY * (1 + i)), x: Math.floor((points[0].x + line.point({y: i * size + size / 2}) - x) / size)});
            ids.push((from.y + signY * (1 + i)) * amount + Math.floor((points[0].x + line.point({y: signY * (i * size + size / 2)}) - x) / size));
        }
    } else {
        for (let i = 1; i <= Math.abs(to.x - from.x); i++){
            ids.push(from.x + signX + (from.y + signY) * amount);
        }
    }

    console.log(ids);

    res.status(200).send({ids});
});

app.post('/img', upload.single('file'), function(req, res) {
    res.set({
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
    });

    const image = req.file;
    console.log(image);

    let points = Array(0);

    async function analyzeImage(imagePath) {
        try {
            const { data, info } = await sharp(imagePath)
                .raw()
                .toBuffer({ resolveWithObject: true });
            console.log(info.height)
            for (let y = 0; y < info.height; y++) {
                points.push({id: y, line: Array(0)});
                for (let x = 0; x < info.width; x++) {
                const idx = (info.width * y + x) * info.channels;

                let red = data[idx];
                let green = data[idx + 1];
                let blue = data[idx + 2]; 

                if (red < 200) red = 1;
                else red = 0
                if (green < 200) green = 1;
                else green = 0
                if (blue < 200) blue = 1;
                else blue = 0

                if (red + green + blue >= 2) points[y].line.push({id: `${y}-${x}`, isActive: true});
                else points[y].line.push({id: `${y}-${x}`, isActive: false});
                }
            }
        } catch (err) {
          console.error('Error processing image:', err);
        }
    }

    analyzeImage(`./img/${req.file.filename}`)
    .then(() => res.status(200).send({points}))
});

app.post('/video', upload.single('video'), async (req, res) => {
    const videoPath = req.file.path;
    const framesDir = path.join(__dirname, 'frames');
    const outputDir = path.join(__dirname, 'outputs');
    fs.mkdirSync(framesDir, { recursive: true });
    fs.mkdirSync(outputDir, { recursive: true });
  
    const extractFrames = () =>
      new Promise((resolve, reject) => {
        ffmpeg(videoPath)
          .output(path.join(framesDir, 'frame-%03d.png'))
          .outputOptions('-vf', 'fps=1')
          .on('end', resolve)
          .on('error', reject)
          .run();
      });
  
    const getSharpestFrame = () => {
      const files = fs.readdirSync(framesDir).filter(f => f.endsWith('.png'));
      let maxScore = 0;
      let sharpestFile = '';
  
      for (const file of files) {
        const img = cv.imread(path.join(framesDir, file)).bgrToGray();
        const laplacian = img.laplacian(cv.CV_64F);
        const score = laplacian.abs().mean().w;
        if (score > maxScore) {
          maxScore = score;
          sharpestFile = file;
        }
      }
  
      return path.join(framesDir, sharpestFile);
    };
  
    const getTextAngleWithOpenCV = (imagePath) => {
      const img = cv.imread(imagePath);
      const gray = img.bgrToGray();
      const blurred = gray.gaussianBlur(new cv.Size(5, 5), 0);
      const thresh = blurred.threshold(0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);
      const contours = thresh.findContours(cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

      const angles = [];

      contours.forEach(c => {
        if (c.area < 100) return;
        const rotatedRect = c.minAreaRect();
        let angle = rotatedRect.angle;
        if (rotatedRect.size.width < rotatedRect.size.height) {
          angle += 90;
        }
        angles.push(angle);
      });

      if (angles.length === 0) return 0;
      const avgAngle = angles.reduce((a, b) => a + b, 0) / angles.length;
      return Number(avgAngle.toFixed(2));
    };
  
    const recognizeText = async (imagePath, originalMat) => {
      const worker = await createWorker('rus', 6);

      const { data } = await worker.recognize(imagePath);

      await worker.terminate();

      console.log(data);

      if (data.words && data.words.length > 0) {
        data.words.forEach(word => {
          const { bbox, text } = word;
          const { x0, y0, x1, y1 } = bbox;

          originalMat.drawRectangle(
            new cv.Point2(x0, y0),
            new cv.Point2(x1, y1),
            new cv.Vec(0, 255, 0),
            2
          );

          originalMat.putText(
            text,
            new cv.Point2(x0, y0 - 5),
            cv.FONT_HERSHEY_SIMPLEX,
            0.5,
            new cv.Vec(0, 255, 0),
            1
          );
        });
      } else {
        console.warn('Слова не найдены (data.words пусто)');
      }

      const cleanedText = data.text.trim().replace(/[^\wа-яА-Я]/gi, '_').slice(0, 30);
      const outputFilename = `${cleanedText || 'result'}.png`;
      const outputPath = path.join(outputDir, outputFilename);
      cv.imwrite(outputPath, originalMat);

      return { cleanedText, outputPath };
    };
  
    try {
      await extractFrames();
      const sharpestFramePath = getSharpestFrame();
      const angle = getTextAngleWithOpenCV(sharpestFramePath);
      const originalMat = cv.imread(sharpestFramePath);
  
      const { cleanedText, outputPath } = await recognizeText(sharpestFramePath, originalMat);
  
      res.send({
        message: 'Готово',
        angle,
        text: cleanedText,
        output: outputPath
      });
    } catch (err) {
      console.error(err);
      res.status(500).send({ error: 'Ошибка при обработке видео' });
    } finally {
      fs.rmSync(framesDir, { recursive: true, force: true });
      fs.rmSync(req.file.path, { force: true });
    }
  });

app.listen(5000);