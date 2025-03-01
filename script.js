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