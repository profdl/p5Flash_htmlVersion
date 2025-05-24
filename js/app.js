let canvas;
let currentTool = 'brush';
let isDrawing = false;
let startX, startY;
let drawingHistory = [];
let currentHistoryIndex = -1;
let drawingActions = []; // Array to store all drawing actions
let canvasX, canvasY; // Store canvas position
let isPlaying = false; // Track if animation is playing
let customDrawFunction = null; // Store the current draw function
let userSetupFunction = null; // Store the user's setup function
let userDrawFunction = null; // Store the user's draw function

// Initialize the code editor
const editor = ace.edit("code-editor");
editor.setTheme("ace/theme/monokai");
editor.session.setMode("ace/mode/javascript");
editor.setReadOnly(false); // Make editor editable

function setup() {
    canvas = createCanvas(800, 600);
    canvas.parent('canvas-container');
    background(255);
    
    // Get canvas position
    const canvasElement = select('#canvas-container');
    canvasX = canvasElement.position().x;
    canvasY = canvasElement.position().y;
    
    // Initialize the drawing history with the initial blank canvas
    saveToHistory();
    
    // Set up event listeners
    setupToolListeners();
    setupCodeEditor();
}

function isMouseInCanvas() {
    return mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height;
}

function draw() {
    if (isPlaying && userDrawFunction) {
        // Execute the user's draw function
        userDrawFunction();
    } else {
        // Normal drawing mode
        if (currentTool !== 'brush') {
            if (currentHistoryIndex >= 0) {
                image(drawingHistory[currentHistoryIndex], 0, 0);
            }
        }

        if (isDrawing && isMouseInCanvas()) {
            switch (currentTool) {
                case 'brush':
                    stroke(select('#color-picker').value());
                    strokeWeight(select('#size-slider').value());
                    line(pmouseX, pmouseY, mouseX, mouseY);
                    // Store brush stroke action
                    drawingActions.push({
                        type: 'brush',
                        x1: pmouseX,
                        y1: pmouseY,
                        x2: mouseX,
                        y2: mouseY,
                        color: select('#color-picker').value(),
                        weight: select('#size-slider').value()
                    });
                    break;
                case 'rectangle':
                    // Draw preview
                    push();
                    stroke(select('#color-picker').value());
                    strokeWeight(select('#size-slider').value());
                    noFill();
                    rect(startX, startY, mouseX - startX, mouseY - startY);
                    pop();
                    break;
                case 'circle':
                    // Draw preview
                    push();
                    stroke(select('#color-picker').value());
                    strokeWeight(select('#size-slider').value());
                    noFill();
                    let diameter = dist(startX, startY, mouseX, mouseY) * 2;
                    circle(startX, startY, diameter);
                    pop();
                    break;
                case 'line':
                    // Draw preview
                    push();
                    stroke(select('#color-picker').value());
                    strokeWeight(select('#size-slider').value());
                    line(startX, startY, mouseX, mouseY);
                    pop();
                    break;
            }
        }
    }
}

function mousePressed() {
    if (isMouseInCanvas()) {
        isDrawing = true;
        startX = mouseX;
        startY = mouseY;
    }
}

function mouseReleased() {
    if (isDrawing && isMouseInCanvas()) {
        isDrawing = false;
        
        switch (currentTool) {
            case 'rectangle':
                stroke(select('#color-picker').value());
                strokeWeight(select('#size-slider').value());
                rect(startX, startY, mouseX - startX, mouseY - startY);
                // Store rectangle action
                drawingActions.push({
                    type: 'rectangle',
                    x: startX,
                    y: startY,
                    width: mouseX - startX,
                    height: mouseY - startY,
                    color: select('#color-picker').value(),
                    weight: select('#size-slider').value()
                });
                break;
            case 'circle':
                stroke(select('#color-picker').value());
                strokeWeight(select('#size-slider').value());
                let diameter = dist(startX, startY, mouseX, mouseY) * 2;
                circle(startX, startY, diameter);
                // Store circle action
                drawingActions.push({
                    type: 'circle',
                    x: startX,
                    y: startY,
                    diameter: diameter,
                    color: select('#color-picker').value(),
                    weight: select('#size-slider').value()
                });
                break;
            case 'line':
                stroke(select('#color-picker').value());
                strokeWeight(select('#size-slider').value());
                line(startX, startY, mouseX, mouseY);
                // Store line action
                drawingActions.push({
                    type: 'line',
                    x1: startX,
                    y1: startY,
                    x2: mouseX,
                    y2: mouseY,
                    color: select('#color-picker').value(),
                    weight: select('#size-slider').value()
                });
                break;
        }
        
        saveToHistory();
    }
}

function setupToolListeners() {
    // Tool selection
    selectAll('.tool').forEach(tool => {
        tool.mousePressed(() => {
            selectAll('.tool').forEach(t => t.removeClass('active'));
            tool.addClass('active');
            currentTool = tool.id().replace('-tool', '');
            
            // Stop code execution when switching to drawing mode
            if (isPlaying) {
                select('#stop-code').mousePressed();
            }
        });
    });
    
    // Clear canvas
    select('#clear-canvas').mousePressed(() => {
        background(255);
        drawingActions = []; // Clear drawing actions
        drawingHistory = []; // Clear drawing history
        currentHistoryIndex = -1; // Reset history index
        saveToHistory(); // Save the initial blank state
        updateCodePanel(); // Update the code panel
        
        // Stop code execution when clearing canvas
        if (isPlaying) {
            select('#stop-code').mousePressed();
        }
    });
    
    // Undo
    select('#undo').mousePressed(() => {
        if (currentHistoryIndex > 0) {
            currentHistoryIndex--;
            loadFromHistory();
            
            // Stop code execution when undoing
            if (isPlaying) {
                select('#stop-code').mousePressed();
            }
        }
    });
    
    // Redo
    select('#redo').mousePressed(() => {
        if (currentHistoryIndex < drawingHistory.length - 1) {
            currentHistoryIndex++;
            loadFromHistory();
            
            // Stop code execution when redoing
            if (isPlaying) {
                select('#stop-code').mousePressed();
            }
        }
    });
}

function saveToHistory() {
    // Remove any future states if we're not at the end
    drawingHistory = drawingHistory.slice(0, currentHistoryIndex + 1);
    
    // Save current canvas state
    drawingHistory.push(canvas.get());
    currentHistoryIndex = drawingHistory.length - 1;
    
    // Update code panel
    updateCodePanel();
}

function loadFromHistory() {
    if (currentHistoryIndex >= 0 && currentHistoryIndex < drawingHistory.length) {
        image(drawingHistory[currentHistoryIndex], 0, 0);
        updateCodePanel();
    }
}

function updateCodePanel() {
    const code = generateCode();
    editor.setValue(code);
    editor.clearSelection();
}

// Add new function to handle code execution
function setupCodeEditor() {
    // Add play/stop buttons
    select('#play-code').mousePressed(() => {
        try {
            // Get the code from the editor
            const code = editor.getValue();
            
            // Create new functions from the code
            const fullCode = `
                ${code}
                if (typeof setup === 'function') {
                    userSetupFunction = setup;
                }
                if (typeof draw === 'function') {
                    userDrawFunction = draw;
                }
            `;
            
            // Execute the code to define the functions
            new Function(fullCode)();
            
            // Run setup once
            if (userSetupFunction) {
                userSetupFunction();
            }
            
            // Start playing
            isPlaying = true;
            loop();
            
            // Update button states
            select('#play-code').style('opacity', '0.5');
            select('#stop-code').style('opacity', '1');
            
            // Disable drawing tools while code is running
            selectAll('.tool').forEach(tool => {
                tool.style('opacity', '0.5');
                tool.style('pointer-events', 'none');
            });
        } catch (error) {
            console.error('Error executing code:', error);
            alert('Error executing code: ' + error.message);
        }
    });
    
    select('#stop-code').mousePressed(() => {
        // Stop playing
        isPlaying = false;
        userSetupFunction = null;
        userDrawFunction = null;
        noLoop();
        
        // Restore the last drawing state
        if (currentHistoryIndex >= 0) {
            image(drawingHistory[currentHistoryIndex], 0, 0);
        }
        
        // Update button states
        select('#play-code').style('opacity', '1');
        select('#stop-code').style('opacity', '0.5');
        
        // Re-enable drawing tools
        selectAll('.tool').forEach(tool => {
            tool.style('opacity', '1');
            tool.style('pointer-events', 'auto');
        });
    });
    
    // Add event listener for code changes
    editor.getSession().on('change', debounce(() => {
        // When code changes, stop the current execution and restart
        if (isPlaying) {
            select('#stop-code').mousePressed();
            // Small delay to ensure the stop is complete
            setTimeout(() => {
                select('#play-code').mousePressed();
            }, 100);
        }
    }, 500));
}

// Debounce function to prevent too frequent updates
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
} 