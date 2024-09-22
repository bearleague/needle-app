// *** Existing canvas gauge code commented out ***
// const canvas = document.getElementById('needleCanvas');
// const ctx = canvas.getContext('2d');

// // Function to draw the gauge
// function drawGauge(percentage) {
//     // Existing code...
// }

// // Initial draw at 0%
// drawGauge(0);

// *** Gauge.js integration starts here ***

// Gauge.js options
var opts = {
    angle: -0.2, // The span of the gauge arc
    lineWidth: 0.1, // Thickness of the gauge arc
    radiusScale: 1, // Relative radius
    pointer: {
        length: 0.6, // Relative to gauge radius
        strokeWidth: 0.035, // Thickness
        color: '#000000' // Pointer color
    },
    limitMax: false,
    limitMin: false,
    colorStart: '#6FADCF',   // Colors
    colorStop: '#8FC0DA',    // Just experiment with them
    strokeColor: '#E0E0E0',  // To see which ones work best for you
    generateGradient: true,
    highDpiSupport: true,     // High resolution support
};

// Target the canvas element
var target = document.getElementById('gaugeCanvas');

// Create the gauge
var gauge = new Gauge(target).setOptions(opts);

// Set gauge properties
gauge.maxValue = 100; // Maximum value
gauge.setMinValue(0); // Minimum value
gauge.animationSpeed = 32; // Animation speed
gauge.set(0); // Initial value

let needles = [];

// Function to save needles to local storage
function saveNeedles() {
    localStorage.setItem('needles', JSON.stringify(needles));
}

// Function to load needles from local storage
function loadNeedles() {
    const storedNeedles = localStorage.getItem('needles');
    if (storedNeedles) {
        needles = JSON.parse(storedNeedles);
        updateNeedleDropdown();
        if (needles.length > 0) {
            // Set the selected needle to the first one
            document.getElementById('needleSelect').value = 0;
            displayTasks(0);
            updateGauge(0);
        }
    }
}

// Call loadNeedles when the script loads
loadNeedles();

// Function to update the needle dropdown
function updateNeedleDropdown() {
    const needleSelect = document.getElementById('needleSelect');
    needleSelect.innerHTML = '';
    needles.forEach((needle, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = needle.name;
        needleSelect.appendChild(option);
    });
}

// Function to add a new needle
document.getElementById('addNeedleBtn').onclick = () => {
    const name = document.getElementById('needleName').value.trim();
    if (name) {
        needles.push({ name: name, tasks: [] });
        document.getElementById('needleName').value = '';
        updateNeedleDropdown();
        alert(`Needle "${name}" added!`);
        saveNeedles(); // Save after adding a new needle
    } else {
        alert('Please enter a needle name.');
    }
};

// Function to add a new task
document.getElementById('addTaskBtn').onclick = () => {
    const taskName = document.getElementById('taskName').value.trim();
    const needleIndex = document.getElementById('needleSelect').value;

    if (taskName && needleIndex !== '') {
        needles[needleIndex].tasks.push({ name: taskName, completed: false });
        document.getElementById('taskName').value = '';
        alert(`Task "${taskName}" added to "${needles[needleIndex].name}"!`);
        displayTasks(needleIndex);
        updateGauge(needleIndex);
        saveNeedles(); // Save after adding a new task
    } else {
        alert('Please enter a task name and select a needle.');
    }
};

// Function to display tasks for a selected needle
function displayTasks(needleIndex) {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';

    if (needles[needleIndex]) {
        needles[needleIndex].tasks.forEach((task, taskIndex) => {
            const li = document.createElement('li');
            li.style.display = 'flex';
            li.style.alignItems = 'center';
            li.style.justifyContent = 'space-between';

            // Create a span for the task name
            const taskSpan = document.createElement('span');
            taskSpan.textContent = task.name;
            taskSpan.style.cursor = 'pointer';
            taskSpan.style.textDecoration = task.completed ? 'line-through' : 'none';

            // Toggle task completion on click
            taskSpan.onclick = () => {
                task.completed = !task.completed;
                displayTasks(needleIndex);
                updateGauge(needleIndex);
                saveNeedles(); // Save after toggling task completion
            };

            // Create a delete button (Font Awesome trash can icon)
            const deleteBtn = document.createElement('button');
deleteBtn.classList.add('delete-btn'); // Add the class for styling

// Add the Font Awesome icon
deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';

            

            // Delete the task on click
            deleteBtn.onclick = () => {
                // Remove the task from the tasks array
                needles[needleIndex].tasks.splice(taskIndex, 1);
                displayTasks(needleIndex);
                updateGauge(needleIndex);
                saveNeedles(); // Save after deleting the task
            };

            // Append the task name and delete button to the list item
            li.appendChild(taskSpan);
            li.appendChild(deleteBtn);

            // Append the list item to the task list
            taskList.appendChild(li);
        });
    }
}

// Function to update the gauge based on completed tasks
function updateGauge(needleIndex) {
    const needle = needles[needleIndex];
    const totalTasks = needle.tasks.length;
    const completedTasks = needle.tasks.filter(task => task.completed).length;
    const percentage = totalTasks ? (completedTasks / totalTasks) * 100 : 0;

    // Update the Gauge.js gauge value
    gauge.set(percentage);
}

// Update tasks and gauge when a different needle is selected
document.getElementById('needleSelect').onchange = () => {
    const needleIndex = document.getElementById('needleSelect').value;
    displayTasks(needleIndex);
    updateGauge(needleIndex);
};
