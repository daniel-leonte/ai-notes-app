let notes = JSON.parse(localStorage.getItem('notes')) || [];

// Show a specific page
function showPage(pageId, idx=null) {
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove("active");
  });
  const newCurrentPage = document.getElementById(pageId);
  newCurrentPage.classList.add('active');

  if (pageId === "write-page") {
    newCurrentPage.dataset.noteIdx = idx
  }
}

// Save note and return to list
function saveNote() {
  const input = document.getElementById('note-input').value;
  const idx = document.getElementById("write-page").dataset.noteIdx;
  if (input) {
    // Edit note OR create one
    idx !== "null" ? notes[idx] = input : notes.push(input);
    localStorage.setItem('notes', JSON.stringify(notes));
    document.getElementById('note-input').value = '';
    displayNotes();
    }
  showPage('list-page');
}

// Display notes on list page
function displayNotes() {
  const list = document.getElementById('note-list');
  list.innerHTML = notes.map((note, i) => `<p onclick="editNote(${i})">${i + 1}. ${note.slice(0, 50)}</p>`).join('');
}

function editNote(i) {
  document.getElementById('note-input').value = notes[i];
  showPage("write-page", i);
}

// Load notes on start
displayNotes();


// === AI PART ===
// https://github.com/tensorflow/tfjs-examples/blob/master/sentiment/README.md

const url = {
  modelUrl: 'https://storage.googleapis.com/tfjs-models/tfjs/sentiment_cnn_v1/model.json',
  metadataUrl: 'https://storage.googleapis.com/tfjs-models/tfjs/sentiment_cnn_v1/metadata.json'
};

const PAD_INDEX = 0;  // Index of the padding character.
const OOV_INDEX = 2;  // Index fo the OOV character.

let model, metadata;

async function loadModel(url) {
  try {
    model = await tf.loadLayersModel(url.modelUrl);
    console.log("model", model);
  } catch (err) {
    console.log(err);
  }
}

async function loadMetadata(url) {
  try {
    const metadataJson = await fetch(url.metadataUrl);
    metadata = await metadataJson.json();
    console.log("metadata", metadata);
  } catch (err) {
    console.log(err);
  }
}

loadModel(url);
loadMetadata(url);

// Pad and truncate all sequences to the same length
const padSequences = (sequences, maxLen, padding = 'pre', truncating = 'pre', value = PAD_INDEX) => {
  return sequences.map(seq => {
    if (seq.length > maxLen) {
      if (truncating === 'pre') {
        seq.splice(0, seq.length - maxLen);
      } else {
        seq.splice(maxLen, seq.length - maxLen);
      }
    }

    if (seq.length < maxLen) {
      const pad = [];
      for (let i = 0; i < maxLen - seq.length; ++i) {
        pad.push(value);
      }
      if (padding === 'pre') {
        seq = pad.concat(seq);
      } else {
        seq = seq.concat(pad);
      }
    }

    return seq;
  });
}

const getSentimentScore = (text = document.getElementById('note-input').value) => {
  const inputText = text.trim().toLowerCase().replace(/(\.|\,|\!)/g, '').split(' ');
  console.log("inputText", inputText);

  const sequence = inputText.map(word => {
    let wordIndex = metadata.word_index[word] + metadata.index_from;
    if (wordIndex > metadata.vocabulary_size) {
      wordIndex = OOV_INDEX;
    }
    return wordIndex;
  });
  console.log("sequence", sequence);

  const paddedSequence = padSequences([sequence], metadata.max_len);
  const input = tf.tensor2d(paddedSequence, [1, metadata.max_len]);
  console.log("tensorInput", input);
  
  const predictOut = model.predict(input);
  const score = predictOut.dataSync()[0];
  predictOut.dispose();
  
  console.log('score', score);
  document.getElementById("sentiment-score").innerHTML = (score * 100).toFixed(2) + "% positive vibe";
  return score;
}
