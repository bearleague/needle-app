// *** Gauge.js Integration Starts Here ***

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

let needles = []; // Array to store needles

/**
 * Displays a toast notification overlay within the app.
 * @param {string} message - The message to display.
 * @param {string} type - The type of message: 'success', 'error', 'info'.
 * @param {number} duration - Duration in milliseconds before the message hides.
 */
function showStatusMessage(message, type = 'info', duration = 3000) {
    const statusDiv = document.getElementById('statusMessage');
    const statusText = document.getElementById('statusText');
    
    statusText.textContent = message;
    statusDiv.className = `status-message ${type} show`; // Set the class for styling and show state
    statusDiv.style.display = 'flex'; // Ensure it's visible and uses flexbox
    
    // Remove any existing hide event listeners to prevent multiple triggers
    statusDiv.removeEventListener('transitionend', hideMessage);
    
    /**
     * Hides the toast notification after the specified duration.
     */
    function hideMessage() {
        statusDiv.classList.remove('show');
        statusDiv.classList.add('hide');
    }
    
    // Set a timeout to hide the message after the duration
    const hideTimeout = setTimeout(() => {
        hideMessage();
    }, duration);
    
    /**
     * Completely hides the toast after the hide transition completes.
     */
    function completeHide() {
        statusDiv.classList.remove('hide');
        statusDiv.style.display = 'none';
    }
    
    // Listen for the end of the hide transition to remove the 'hide' class and hide the element
    statusDiv.addEventListener('transitionend', function(event) {
        if (event.propertyName === 'opacity' && statusDiv.classList.contains('hide')) {
            completeHide();
        }
    }, { once: true });
    
    // Since there's no close button, we remove the related event listener code
    // No action needed here
}

/**
 * Saves the current needles array to local storage.
 */
function saveNeedles() {
    localStorage.setItem('needles', JSON.stringify(needles));
}

/**
 * Loads needles from local storage and initializes the UI.
 */
function loadNeedles() {
    const storedNeedles = localStorage.getItem('needles');
    if (storedNeedles) {
        needles = JSON.parse(storedNeedles);
        updateNeedleDropdown();
        if (needles.length > 0) {
            // Automatically select the first needle
            selectNeedle(0);
            displayTasks(0);
            updateGauge(0);
        }
    }
}

// Initialize the app by loading needles
document.addEventListener('DOMContentLoaded', () => {
    loadNeedles();
});

/**
 * Updates the custom dropdown with the current list of needles.
 */
function updateNeedleDropdown() {
    const dropdownList = document.getElementById('dropdownList');
    dropdownList.innerHTML = ''; // Clear existing items

    needles.forEach((needle, index) => {
        // Create the dropdown item container
        const item = document.createElement('div');
        item.classList.add('dropdown-item');
        item.dataset.index = index; // Store the index for reference

        // Create the needle name span
        const needleName = document.createElement('span');
        needleName.textContent = needle.name;

        // Create the delete button
        const deleteBtn = document.createElement('button'); // Using button for better accessibility
        deleteBtn.type = 'button'; // Prevents the button from acting as a submit button
        deleteBtn.classList.add('delete-needle', 'delete-btn');
        deleteBtn.innerHTML = '<i class="fas fa-times"></i>'; // Font Awesome times icon
        deleteBtn.title = 'Delete Needle';
        deleteBtn.setAttribute('aria-label', `Delete needle ${needle.name}`);

        // Event listener for deleting the needle
        deleteBtn.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent triggering the selection
            console.log(`Delete button clicked for needle index: ${index}`); // Debugging log
            initiateDeleteNeedle(index);
        });

        // Append the needle name and delete button to the dropdown item
        item.appendChild(needleName);
        item.appendChild(deleteBtn);

        // Event listener for selecting the needle when clicking on the item (excluding the delete button)
        item.addEventListener('click', () => {
            selectNeedle(index);
            closeDropdown(); // Close the dropdown after selection
        });

        // Append the dropdown item to the dropdown list
        dropdownList.appendChild(item);
    });

    // Handle enabling/disabling task input and add button based on needles
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskNameInput = document.getElementById('taskName');
    const dropdownSelected = document.getElementById('dropdownSelected');

    if (needles.length === 0) {
        addTaskBtn.disabled = true;
        taskNameInput.disabled = true;
        dropdownSelected.innerHTML = 'No Needles Available <i class="fas fa-chevron-down"></i>';
        dropdownSelected.dataset.index = '';
    } else {
        addTaskBtn.disabled = false;
        taskNameInput.disabled = false;
        // If no needle is selected, select the first one
        if (dropdownSelected.dataset.index === '' || dropdownSelected.dataset.index === undefined) {
            selectNeedle(0);
        }
    }
}

/**
 * Selects a needle based on its index and updates the UI accordingly.
 * @param {number} index - The index of the needle to select.
 */
function selectNeedle(index) {
    const dropdownSelected = document.getElementById('dropdownSelected');
    dropdownSelected.innerHTML = `${needles[index].name} <i class="fas fa-chevron-down"></i>`;
    dropdownSelected.dataset.index = index; // Store the selected index
    displayTasks(index);
    updateGauge(index);
}

/**
 * Toggles the visibility of the custom dropdown list.
 */
function toggleDropdown() {
    const dropdownList = document.getElementById('dropdownList');
    const dropdownSelected = document.getElementById('dropdownSelected');
    const isExpanded = dropdownSelected.getAttribute('aria-expanded') === 'true';
    dropdownSelected.setAttribute('aria-expanded', !isExpanded);
    dropdownList.style.display = dropdownList.style.display === 'block' ? 'none' : 'block';
}

/**
 * Closes the custom dropdown list.
 */
function closeDropdown() {
    const dropdownList = document.getElementById('dropdownList');
    const dropdownSelected = document.getElementById('dropdownSelected');
    dropdownSelected.setAttribute('aria-expanded', 'false');
    dropdownList.style.display = 'none';
}

/**
 * Closes the dropdown when clicking outside of it.
 */
window.addEventListener('click', function(event) {
    const dropdown = document.getElementById('customDropdown');
    if (!dropdown.contains(event.target)) {
        closeDropdown();
    }
});

/**
 * Event listener for toggling the dropdown when clicking on the selected area.
 */
document.getElementById('dropdownSelected').addEventListener('click', toggleDropdown);

/**
 * Adds a new needle to the list.
 */
function addNeedle() {
    const needleNameInput = document.getElementById('needleName');
    const name = needleNameInput.value.trim();

    if (name) {
        // Check for duplicate needle names (optional)
        const duplicate = needles.some(needle => needle.name.toLowerCase() === name.toLowerCase());
        if (duplicate) {
            showStatusMessage('A needle with this name already exists.', 'error');
            return;
        }

        // Add the new needle to the array
        needles.push({ name: name, tasks: [] });
        needleNameInput.value = ''; // Clear the input field
        updateNeedleDropdown(); // Refresh the dropdown
        showStatusMessage(`Needle "${name}" added!`, 'success');
        saveNeedles(); // Save to local storage

        // Automatically select the newly added needle
        const newIndex = needles.length - 1;
        selectNeedle(newIndex);
        closeDropdown(); // Close the dropdown after adding
    } else {
        showStatusMessage('Please enter a needle name.', 'error');
    }
}

// Event listener for adding a task when pressing 'Enter' key
document.getElementById('taskName').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent form submission
        addTask();
    }
});

// Event listener for the 'Add Task' button
document.getElementById('addTaskBtn').addEventListener('click', function(event) {
    event.preventDefault(); // Prevent form submission if the button is within a form
    addTask();
});

/**
 * Adds a new task to the selected needle.
 */
function addTask() {
    const taskNameInput = document.getElementById('taskName');
    const taskName = taskNameInput.value.trim();
    const dropdownSelected = document.getElementById('dropdownSelected');
    const needleIndex = parseInt(dropdownSelected.dataset.index, 10);

    if (taskName && !isNaN(needleIndex)) {
        // Check for duplicate task names within the same needle (optional)
        const duplicate = needles[needleIndex].tasks.some(task => task.name.toLowerCase() === taskName.toLowerCase());
        if (duplicate) {
            showStatusMessage('A task with this name already exists in the selected needle.', 'error');
            return;
        }

        // Add the new task to the selected needle
        needles[needleIndex].tasks.push({ name: taskName, completed: false });
        taskNameInput.value = ''; // Clear the input field
        showStatusMessage(`Task "${taskName}" added to "${needles[needleIndex].name}"!`, 'success');
        displayTasks(needleIndex); // Refresh the task list
        updateGauge(needleIndex); // Update the gauge
        saveNeedles(); // Save to local storage
    } else {
        showStatusMessage('Please enter a task name and select a needle.', 'error');
    }
}

/**
 * Displays the list of tasks for the selected needle.
 * @param {number} needleIndex - The index of the selected needle.
 */
function displayTasks(needleIndex) {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = ''; // Clear existing tasks

    if (needles[needleIndex]) {
        needles[needleIndex].tasks.forEach((task, taskIndex) => {
            const li = document.createElement('li');

            // Create a container for the task info
            const taskInfo = document.createElement('div');

            // Create a check mark button for marking task completion
            const checkBtn = document.createElement('button');
            checkBtn.classList.add('check-btn'); // Styling class
            checkBtn.title = task.completed ? 'Mark as incomplete' : 'Mark as complete';
            checkBtn.setAttribute('aria-label', task.completed ? 'Mark as incomplete' : 'Mark as complete');

            // Set the Font Awesome icon based on task completion
            checkBtn.innerHTML = task.completed
                ? '<i class="fas fa-check-circle"></i>' // Filled check circle
                : '<i class="far fa-circle"></i>';      // Empty circle

            // Toggle task completion on click
            checkBtn.addEventListener('click', () => {
                task.completed = !task.completed;
                displayTasks(needleIndex);
                updateGauge(needleIndex);
                saveNeedles(); // Save after toggling
            });

            // Create a span for the task name
            const taskSpan = document.createElement('span');
            taskSpan.textContent = task.name;
            taskSpan.style.marginLeft = '10px';
            taskSpan.style.textDecoration = task.completed ? 'line-through' : 'none';

            // Assemble the task info container
            taskInfo.appendChild(checkBtn);
            taskInfo.appendChild(taskSpan);

            // Create a delete button for removing the task
            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button'; // Prevents the button from acting as a submit button
            deleteBtn.classList.add('delete-btn'); // Styling class
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>'; // Font Awesome trash icon
            deleteBtn.title = 'Delete Task';
            deleteBtn.setAttribute('aria-label', `Delete task ${task.name}`);

            // Delete the task on click
            deleteBtn.addEventListener('click', () => {
                // Remove the task from the tasks array
                needles[needleIndex].tasks.splice(taskIndex, 1);
                displayTasks(needleIndex);
                updateGauge(needleIndex);
                saveNeedles(); // Save after deletion
                showStatusMessage(`Task "${task.name}" deleted.`, 'info');
            });

            // Append the task info and delete button to the list item
            li.appendChild(taskInfo);
            li.appendChild(deleteBtn);

            // Append the list item to the task list
            taskList.appendChild(li);
        });
    }
}

/**
 * Updates the gauge based on the completed tasks of the selected needle.
 * @param {number} needleIndex - The index of the selected needle.
 */
function updateGauge(needleIndex) {
    const needle = needles[needleIndex];
    const totalTasks = needle.tasks.length;
    const completedTasks = needle.tasks.filter(task => task.completed).length;
    const percentage = totalTasks ? (completedTasks / totalTasks) * 100 : 0;

    // Update the Gauge.js gauge value
    gauge.set(percentage);
}

// *** Delete Needle Functionality Starts Here ***

/**
 * Initiates the deletion process by showing the confirmation modal.
 * @param {number} index - The index of the needle to delete.
 */
function initiateDeleteNeedle(index) {
    const confirmationModal = document.getElementById('confirmationModal');
    confirmationModal.style.display = 'flex'; // Show the modal

    // Store the index to be deleted in a data attribute for later reference
    confirmationModal.dataset.deleteIndex = index;
}

/**
 * Deletes a needle at the specified index.
 * @param {number} index - The index of the needle to delete.
 */
function deleteNeedle(index) {
    console.log(`Attempting to delete needle at index: ${index}`); // Debugging log
    if (isNaN(index) || index < 0 || index >= needles.length) {
        showStatusMessage('Invalid needle selected for deletion.', 'error');
        console.error('Delete operation failed: Invalid index.');
        return;
    }

    const needleName = needles[index].name;
    console.log(`Deleting needle: ${needleName}`); // Debugging log

    // Remove the needle from the needles array
    needles.splice(index, 1);
    showStatusMessage(`Needle "${needleName}" has been deleted.`, 'info');
    console.log(`Needle "${needleName}" deleted successfully.`); // Debugging log
    saveNeedles(); // Save after deletion

    // Update the dropdown
    updateNeedleDropdown();

    // If there are needles left, select the first one; else, clear the task list and reset the gauge
    if (needles.length > 0) {
        selectNeedle(0);
    } else {
        const dropdownSelected = document.getElementById('dropdownSelected');
        dropdownSelected.innerHTML = 'No Needles Available <i class="fas fa-chevron-down"></i>';
        dropdownSelected.dataset.index = '';
        const taskList = document.getElementById('taskList');
        taskList.innerHTML = '';
        gauge.set(0);
    }
}

// *** Confirmation Modal Event Listeners ***

document.addEventListener('DOMContentLoaded', () => {
    const confirmationModal = document.getElementById('confirmationModal');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

    /**
     * Confirms the deletion and proceeds to delete the needle.
     */
    confirmDeleteBtn.addEventListener('click', () => {
        const index = parseInt(confirmationModal.dataset.deleteIndex, 10);
        deleteNeedle(index);
        closeModal();
    });

    /**
     * Cancels the deletion and closes the modal.
     */
    cancelDeleteBtn.addEventListener('click', () => {
        closeModal();
    });

    /**
     * Closes the confirmation modal.
     */
    function closeModal() {
        confirmationModal.style.display = 'none';
        confirmationModal.dataset.deleteIndex = ''; // Clear the stored index
    }

    /**
     * Optional: Close modal when clicking outside the modal content
     */
    window.addEventListener('click', function(event) {
        if (event.target == confirmationModal) {
            closeModal();
        }
    });
});

// Initialize confirmationModal display to 'none' on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    const confirmationModal = document.getElementById('confirmationModal');
    confirmationModal.style.display = 'none';
});
