function generateCode() {
    let code = `// Generated drawing code
// You can modify this code and click 'Play' to see the results

function setup() {
    // Canvas is already created, but you can add your setup code here
    // For example: frameRate(30), colorMode(HSB), etc.
}

function draw() {
    // Drawing code
    ${generateDrawingCode()}
}`;
    return code;
}

function generateDrawingCode() {
    if (!drawingActions || drawingActions.length === 0) {
        return '// No drawing actions yet';
    }

    let code = '';
    
    // Generate code for each drawing action
    drawingActions.forEach((action, index) => {
        code += generateActionCode(action);
        if (index < drawingActions.length - 1) {
            code += '\n    ';
        }
    });
    
    return code;
}

function generateActionCode(action) {
    switch (action.type) {
        case 'brush':
            return `stroke('${action.color}');
    strokeWeight(${action.weight});
    line(${action.x1}, ${action.y1}, ${action.x2}, ${action.y2});`;
            
        case 'rectangle':
            return `stroke('${action.color}');
    strokeWeight(${action.weight});
    rect(${action.x}, ${action.y}, ${action.width}, ${action.height});`;
            
        case 'circle':
            return `stroke('${action.color}');
    strokeWeight(${action.weight});
    circle(${action.x}, ${action.y}, ${action.diameter});`;
            
        case 'line':
            return `stroke('${action.color}');
    strokeWeight(${action.weight});
    line(${action.x1}, ${action.y1}, ${action.x2}, ${action.y2});`;
            
        default:
            return '';
    }
}

// This function will be expanded to analyze the canvas and generate actual drawing commands
function analyzeCanvasState(canvasState) {
    // TODO: Implement canvas analysis
    // This would involve:
    // 1. Analyzing the canvas pixels
    // 2. Detecting shapes and lines
    // 3. Converting them to p5.js drawing commands
    return '';
} 