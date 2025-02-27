const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

const upload = multer({
    dest: 'uploads/',
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/upload', upload.single('aadharPhoto'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }

        const filePath = path.join(__dirname, req.file.path);
        const result = await Tesseract.recognize(filePath, 'eng');
        const text = result.data.text;
        fs.unlinkSync(filePath);

        console.log('Full OCR Output:', text);

        // Clean and preprocess the text
        const cleanedText = text.replace(/\s+/g, ' ').trim();
        console.log('Cleaned OCR Output:', cleanedText);

        // Updated regex patterns
        const nameMatch = cleanedText.match(/(\b[A-Z][a-z]+\s[A-Z][a-z]+\b)/);
        const name = nameMatch ? nameMatch[1] : 'Not found';
        console.log('Name Match Result:', nameMatch);
        console.log('Extracted Name:', name);

        const numberMatch = cleanedText.match(/\d{4}\s*\d{4}\s*\d{4}/);
        const number = numberMatch ? numberMatch[0] : 'Not found';
        console.log('Number Match Result:', numberMatch);
        console.log('Extracted Number:', number);

        res.render('result', { name, number });
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred while processing the image.');
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
