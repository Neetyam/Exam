/**
 * Premium Microsoft Word-Style Shape Drawing & Whiteboard Engine
 * Built for Spring Boot + Thymeleaf + PostgreSQL examination portals
 * Uses Fabric.js for high-fidelity interactive vector graphics
 * Author: Antigravity AI
 */

(function () {
    // History states mapped by question ID
    const canvasStates = {};

    /**
     * Initializes whiteboard drawing canvases below descriptive question answer containers.
     * @param {Long} attemptId - Active student exam attempt ID
     * @param {Long} submissionId - Active student paper submission ID
     */
    function initializeDrawingTool(attemptId, submissionId) {
        if (!window.fabric) {
            console.warn("Fabric.js is not loaded yet. Retrying whiteboard initialization in 500ms...");
            setTimeout(() => initializeDrawingTool(attemptId, submissionId), 500);
            return;
        }

        try {
            // Scan for descriptive question areas
            // 1. Dynamic Descriptive questions (exam_interface)
            const descTextareas = document.querySelectorAll('textarea.answer-area');
            if (descTextareas.length > 0) {
                descTextareas.forEach(textarea => {
                    const qid = textarea.getAttribute('data-qid');
                    if (!qid) return;
                    
                    // Avoid double initialization
                    if (document.getElementById(`wb-container-${qid}`)) return;

                    // Inject whiteboard container directly below the textarea card parent
                    const questionCard = textarea.closest('.question-card') || textarea.closest('.question-item') || textarea.closest('.card') || textarea.parentNode;
                    if (questionCard) {
                        const whiteboardWrapper = document.createElement('div');
                        whiteboardWrapper.innerHTML = createWhiteboardHTML(qid);
                        questionCard.appendChild(whiteboardWrapper);
                        
                        setupFabricCanvas(qid, attemptId, submissionId);
                    }
                });
            }

            // 2. Section-based Descriptive questions (exam_section)
            const sectionTextareas = document.querySelectorAll('.answer-textarea.answer-area');
            if (sectionTextareas.length > 0) {
                sectionTextareas.forEach(textarea => {
                    const qid = textarea.getAttribute('data-qid');
                    if (!qid) return;
                    
                    if (document.getElementById(`wb-container-${qid}`)) return;

                    // For exam_section, append whiteboard card under the answer card parent
                    const answerCard = textarea.closest('.question-item') || textarea.closest('.question-card') || textarea.closest('.card') || textarea.parentNode;
                    if (answerCard) {
                        const whiteboardWrapper = document.createElement('div');
                        whiteboardWrapper.innerHTML = createWhiteboardHTML(qid);
                        answerCard.appendChild(whiteboardWrapper);
                        
                        setupFabricCanvas(qid, attemptId, submissionId);
                    }
                });
            }

            // 3. PDF-based Descriptive questions (paper_exam_interface)
            const paperTextarea = document.getElementById('answerTextarea');
            if (paperTextarea) {
                const qid = 'paper-full';
                if (!document.getElementById(`wb-container-${qid}`)) {
                    const answerPanel = paperTextarea.closest('.answer-panel') || paperTextarea.parentNode;
                    if (answerPanel) {
                        const whiteboardWrapper = document.createElement('div');
                        whiteboardWrapper.innerHTML = createWhiteboardHTML(qid);
                        answerPanel.appendChild(whiteboardWrapper);
                        
                        setupFabricCanvas(qid, attemptId, submissionId);
                    }
                }
            }
        } catch (e) {
            console.error("Whiteboard drawing initialization failed:", e);
        }
    }

    /**
     * Generates a modern Microsoft Word-style floating toolbar and drawing canvas template.
     */
    function createWhiteboardHTML(qid) {
        return `
        <div class="whiteboard-container shadow-sm" id="wb-container-${qid}">
            <div class="whiteboard-header">
                <div class="whiteboard-title">
                    <i class="fa-solid fa-compass-drafting fs-5"></i> Word-Style Drawing Canvas & Whitespace (Draw trees, flowcharts, or diagrams)
                </div>
                <span class="badge bg-secondary-subtle text-secondary px-3 py-1.5 rounded-pill small" id="wb-save-status-${qid}">
                    <i class="fa-solid fa-cloud-arrow-up me-1"></i> Saved
                </span>
            </div>
            
            <div class="drawing-toolbar">
                <!-- Group 1: Modes -->
                <div class="toolbar-group">
                    <button type="button" class="drawing-btn active" id="btn-select-${qid}" data-tooltip="Pointer Mode (Move/Resize)">
                        <i class="fa-solid fa-arrow-pointer"></i>
                    </button>
                    <button type="button" class="drawing-btn" id="btn-pencil-${qid}" data-tooltip="Freehand Pencil">
                        <i class="fa-solid fa-pencil"></i>
                    </button>
                </div>
                
                <!-- Group 2: Word Shapes Grid -->
                <div class="toolbar-group">
                    <button type="button" class="drawing-btn" id="btn-rect-${qid}" data-tooltip="Rectangle">
                        <i class="fa-regular fa-square"></i>
                    </button>
                    <button type="button" class="drawing-btn" id="btn-circle-${qid}" data-tooltip="Oval / Circle">
                        <i class="fa-regular fa-circle"></i>
                    </button>
                    <button type="button" class="drawing-btn" id="btn-triangle-${qid}" data-tooltip="Isosceles Triangle">
                        <i class="fa-solid fa-triangle-exclamation" style="font-size:0.8rem;"></i>
                    </button>
                    <button type="button" class="drawing-btn" id="btn-diamond-${qid}" data-tooltip="Diamond / Decision">
                        <i class="fa-solid fa-diamond" style="font-size:0.85rem;"></i>
                    </button>
                    <button type="button" class="drawing-btn" id="btn-line-${qid}" data-tooltip="Connector Line">
                        <i class="fa-solid fa-minus"></i>
                    </button>
                    <button type="button" class="drawing-btn" id="btn-arrow-${qid}" data-tooltip="Pointer Arrow">
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>
                    <button type="button" class="drawing-btn" id="btn-text-${qid}" data-tooltip="Add Text inside Shape">
                        <i class="fa-solid fa-font"></i>
                    </button>
                </div>
                
                <!-- Group 3: Word Colors and Sliders -->
                <div class="toolbar-group">
                    <div class="tool-setting-wrapper">
                        <span>Fill:</span>
                        <input type="color" class="color-picker-input" id="fill-color-${qid}" value="#ffffff">
                    </div>
                    <div class="tool-setting-wrapper">
                        <span>Stroke:</span>
                        <input type="color" class="color-picker-input" id="stroke-color-${qid}" value="#4f46e5">
                    </div>
                    <div class="tool-setting-wrapper">
                        <span>Size:</span>
                        <input type="range" class="brush-slider" id="stroke-width-${qid}" min="1" max="15" value="3">
                    </div>
                </div>
                
                <!-- Group 4: Ordering & Canvas Controls -->
                <div class="toolbar-group">
                    <button type="button" class="drawing-btn" id="btn-eraser-${qid}" data-tooltip="Eraser (Delete Selected)">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                    <button type="button" class="drawing-btn" id="btn-duplicate-${qid}" data-tooltip="Duplicate Object">
                        <i class="fa-regular fa-copy"></i>
                    </button>
                    <button type="button" class="drawing-btn" id="btn-forward-${qid}" data-tooltip="Bring Forward">
                        <i class="fa-solid fa-layer-group"></i>
                    </button>
                    <button type="button" class="drawing-btn" id="btn-backward-${qid}" data-tooltip="Send Backward">
                        <i class="fa-solid fa-layer-group" style="transform: scaleY(-1);"></i>
                    </button>
                    <button type="button" class="drawing-btn" id="btn-grid-${qid}" data-tooltip="Toggle Grid Background">
                        <i class="fa-solid fa-border-all"></i>
                    </button>
                </div>
                
                <!-- Group 5: Whiteboard History -->
                <div class="toolbar-group">
                    <button type="button" class="drawing-btn" id="btn-undo-${qid}" data-tooltip="Undo Action">
                        <i class="fa-solid fa-rotate-left"></i>
                    </button>
                    <button type="button" class="drawing-btn" id="btn-redo-${qid}" data-tooltip="Redo Action">
                        <i class="fa-solid fa-rotate-right"></i>
                    </button>
                    <button type="button" class="drawing-btn text-danger border-danger-subtle" id="btn-clear-${qid}" data-tooltip="Clear Canvas">
                        <i class="fa-solid fa-circle-xmark"></i>
                    </button>
                </div>
            </div>
            
            <div class="canvas-wrapper grid-bg" id="canvas-wrapper-${qid}" style="touch-action: none; user-select: none;">
                <canvas id="canvas-${qid}" width="800" height="400"></canvas>
            </div>
        </div>
        `;
    }

    /**
     * Initializes the Fabric.js dynamic whiteboard instance, registers shape draw listeners, and coordinates history.
     */
    function setupFabricCanvas(qid, attemptId, submissionId) {
        const fabricCanvas = new fabric.Canvas(`canvas-${qid}`, {
            isDrawingMode: false,
            selection: true
        });

        // Initialize state machine
        const state = {
            canvas: fabricCanvas,
            activeTool: 'select', // select, pencil, rect, circle, triangle, diamond, line, arrow, text
            fillColor: '#ffffff',
            strokeColor: '#4f46e5',
            strokeWidth: 3,
            historyUndo: [],
            historyRedo: [],
            isDrawingShape: false,
            tempShape: null,
            startX: 0,
            startY: 0
        };

        canvasStates[qid] = state;

        // Color & Brush updates
        const fillEl = document.getElementById(`fill-color-${qid}`);
        const strokeEl = document.getElementById(`stroke-color-${qid}`);
        const sizeEl = document.getElementById(`stroke-width-${qid}`);

        if (fillEl) fillEl.addEventListener('input', e => {
            state.fillColor = e.target.value;
            updateSelectedObjectProperties(state);
        });
        if (strokeEl) strokeEl.addEventListener('input', e => {
            state.strokeColor = e.target.value;
            state.canvas.freeDrawingBrush.color = e.target.value;
            updateSelectedObjectProperties(state);
        });
        if (sizeEl) sizeEl.addEventListener('input', e => {
            state.strokeWidth = parseInt(e.target.value);
            state.canvas.freeDrawingBrush.width = parseInt(e.target.value);
            updateSelectedObjectProperties(state);
        });

        // Initialize pencil brush parameters
        state.canvas.freeDrawingBrush.color = state.strokeColor;
        state.canvas.freeDrawingBrush.width = state.strokeWidth;

        // Button events binding
        const tools = ['select', 'pencil', 'rect', 'circle', 'triangle', 'diamond', 'line', 'arrow', 'text'];
        tools.forEach(tool => {
            const btn = document.getElementById(`btn-${tool}-${qid}`);
            if (btn) {
                btn.addEventListener('click', () => {
                    // Reset active states
                    tools.forEach(t => {
                        const el = document.getElementById(`btn-${t}-${qid}`);
                        if (el) el.classList.remove('active');
                    });
                    btn.classList.add('active');

                    // Set mode
                    state.activeTool = tool;
                    if (tool === 'pencil') {
                        state.canvas.isDrawingMode = true;
                    } else {
                        state.canvas.isDrawingMode = false;
                        
                        // Disable selection inside vector draw modes so mouse dragging creates shapes
                        if (tool === 'select') {
                            state.canvas.selection = true;
                            state.canvas.forEachObject(obj => obj.selectable = obj.evented = true);
                        } else {
                            state.canvas.selection = false;
                            state.canvas.forEachObject(obj => obj.selectable = obj.evented = false);
                            state.canvas.discardActiveObject().renderAll();
                        }
                    }
                });
            }
        });

        // Extra operations binding
        bindWhiteboardOperations(qid, state);

        // Vector Shape Drawing Mouse Triggers
        setupShapeDrawingEvents(state);

        // Push state on modifications for undo history & auto-saving
        let saveTimeout = null;
        function triggerChange() {
            saveHistoryState(state);
            
            // Show auto-saving indicator
            const statusEl = document.getElementById(`wb-save-status-${qid}`);
            if (statusEl) {
                statusEl.className = 'badge bg-warning-subtle text-warning px-3 py-1.5 rounded-pill small';
                statusEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i> Saving...';
            }

            // Debounced autosave
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                saveCanvasToBackend(qid, state, attemptId, submissionId);
            }, 3000);
        }

        // Periodic 10-seconds secure auto-save interval
        setInterval(() => {
            if (saveTimeout !== null) {
                clearTimeout(saveTimeout);
                saveTimeout = null;
                saveCanvasToBackend(qid, state, attemptId, submissionId);
            }
        }, 10000);

        state.canvas.on({
            'object:added': e => {
                if (!e.target.fromHistory) triggerChange();
            },
            'object:modified': () => triggerChange(),
            'object:removed': e => {
                if (!e.target.fromHistory) triggerChange();
            },
            'text:changed': () => triggerChange()
        });

        // Initial fetch from database
        loadCanvasFromBackend(qid, state, attemptId, submissionId);
    }

    /**
     * Binds layer commands, duplicates, grid toggles, histories, and canvas clears.
     */
    function bindWhiteboardOperations(qid, state) {
        // Eraser / Delete Shape
        const eraserBtn = document.getElementById(`btn-eraser-${qid}`);
        if (eraserBtn) eraserBtn.addEventListener('click', () => {
            const activeObj = state.canvas.getActiveObject();
            if (activeObj) {
                state.canvas.remove(activeObj);
                state.canvas.discardActiveObject().renderAll();
            }
        });

        // Duplicate Active Object
        const dupBtn = document.getElementById(`btn-duplicate-${qid}`);
        if (dupBtn) dupBtn.addEventListener('click', () => {
            const activeObj = state.canvas.getActiveObject();
            if (activeObj) {
                activeObj.clone(cloned => {
                    state.canvas.discardActiveObject();
                    cloned.set({
                        left: cloned.left + 15,
                        top: cloned.top + 15,
                        evented: true
                    });
                    if (cloned.type === 'activeSelection') {
                        cloned.canvas = state.canvas;
                        cloned.forEachObject(obj => state.canvas.add(obj));
                        cloned.setCoords();
                    } else {
                        state.canvas.add(cloned);
                    }
                    state.canvas.setActiveObject(cloned);
                    state.canvas.requestRenderAll();
                });
            }
        });

        // Layer Forward / Backward
        const fwdBtn = document.getElementById(`btn-forward-${qid}`);
        if (fwdBtn) fwdBtn.addEventListener('click', () => {
            const activeObj = state.canvas.getActiveObject();
            if (activeObj) {
                state.canvas.bringForward(activeObj);
            }
        });

        const bwdBtn = document.getElementById(`btn-backward-${qid}`);
        if (bwdBtn) bwdBtn.addEventListener('click', () => {
            const activeObj = state.canvas.getActiveObject();
            if (activeObj) {
                state.canvas.sendBackwards(activeObj);
            }
        });

        // Toggle Grid Background
        const gridBtn = document.getElementById(`btn-grid-${qid}`);
        if (gridBtn) gridBtn.addEventListener('click', () => {
            const wrapper = document.getElementById(`canvas-wrapper-${qid}`);
            if (wrapper) {
                wrapper.classList.toggle('grid-bg');
            }
        });

        // History Undo / Redo
        const undoBtn = document.getElementById(`btn-undo-${qid}`);
        if (undoBtn) undoBtn.addEventListener('click', () => {
            if (state.historyUndo.length > 0) {
                state.historyRedo.push(JSON.stringify(state.canvas.toJSON()));
                const previousState = state.historyUndo.pop();
                state.canvas.loadFromJSON(previousState, () => {
                    state.canvas.renderAll();
                    state.canvas.forEachObject(obj => {
                        obj.fromHistory = true;
                    });
                });
            }
        });

        const redoBtn = document.getElementById(`btn-redo-${qid}`);
        if (redoBtn) redoBtn.addEventListener('click', () => {
            if (state.historyRedo.length > 0) {
                state.historyUndo.push(JSON.stringify(state.canvas.toJSON()));
                const nextState = state.historyRedo.pop();
                state.canvas.loadFromJSON(nextState, () => {
                    state.canvas.renderAll();
                    state.canvas.forEachObject(obj => {
                        obj.fromHistory = true;
                    });
                });
            }
        });

        // Clear Canvas
        const clearBtn = document.getElementById(`btn-clear-${qid}`);
        if (clearBtn) clearBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to clear the entire whiteboard?")) {
                state.canvas.clear();
            }
        });

        // Bind standard Delete / Backspace keys to remove active object
        window.addEventListener('keydown', e => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                // Confirm user is not focused on an active text area or input field
                if (document.activeElement.tagName !== 'INPUT' && 
                    document.activeElement.tagName !== 'TEXTAREA' && 
                    !document.activeElement.classList.contains('tox-edit-area__iframe') &&
                    !state.canvas.getActiveObject()?.isEditing) {
                    
                    const activeObj = state.canvas.getActiveObject();
                    if (activeObj) {
                        state.canvas.remove(activeObj);
                        state.canvas.discardActiveObject().renderAll();
                    }
                }
            }
        });
    }

    /**
     * Changes border colors, brush stroke widths, or backgrounds of currently selected objects.
     */
    function updateSelectedObjectProperties(state) {
        const activeObj = state.canvas.getActiveObject();
        if (activeObj) {
            if (activeObj.type === 'activeSelection') {
                activeObj.forEachObject(obj => {
                    if (obj.stroke) obj.set('stroke', state.strokeColor);
                    if (obj.fill && obj.fill !== 'transparent' && obj.type !== 'textbox') obj.set('fill', state.fillColor);
                    if (obj.strokeWidth) obj.set('strokeWidth', state.strokeWidth);
                });
            } else {
                if (activeObj.stroke) activeObj.set('stroke', state.strokeColor);
                if (activeObj.fill && activeObj.fill !== 'transparent' && activeObj.type !== 'textbox') activeObj.set('fill', state.fillColor);
                if (activeObj.strokeWidth) activeObj.set('strokeWidth', state.strokeWidth);
            }
            state.canvas.renderAll();
        }
    }

    /**
     * Captures undo checkpoints.
     */
    function saveHistoryState(state) {
        state.historyUndo.push(JSON.stringify(state.canvas.toJSON()));
        state.historyRedo = []; // Clear redo stack on manual actions
    }

    /**
     * Coordinate mouse events (Mouse Down, Mouse Move, Mouse Up) to dynamically construct shapes.
     */
    function setupShapeDrawingEvents(state) {
        state.canvas.on('mouse:down', o => {
            if (state.activeTool === 'select' || state.activeTool === 'pencil') return;

            state.isDrawingShape = true;
            const pointer = state.canvas.getPointer(o.e);
            state.startX = pointer.x;
            state.startY = pointer.y;

            const baseOptions = {
                left: state.startX,
                top: state.startY,
                width: 0,
                height: 0,
                fill: state.fillColor,
                stroke: state.strokeColor,
                strokeWidth: state.strokeWidth,
                selectable: false,
                evented: false
            };

            if (state.activeTool === 'rect') {
                state.tempShape = new fabric.Rect(baseOptions);
            } else if (state.activeTool === 'circle') {
                state.tempShape = new fabric.Ellipse({
                    ...baseOptions,
                    rx: 0,
                    ry: 0
                });
            } else if (state.activeTool === 'triangle') {
                state.tempShape = new fabric.Triangle(baseOptions);
            } else if (state.activeTool === 'diamond') {
                state.tempShape = new fabric.Polygon([
                    { x: 0, y: 0 },
                    { x: 0, y: 0 },
                    { x: 0, y: 0 },
                    { x: 0, y: 0 }
                ], {
                    ...baseOptions,
                    left: state.startX,
                    top: state.startY
                });
            } else if (state.activeTool === 'line') {
                state.tempShape = new fabric.Line([state.startX, state.startY, state.startX, state.startY], {
                    stroke: state.strokeColor,
                    strokeWidth: state.strokeWidth,
                    selectable: false,
                    evented: false
                });
            } else if (state.activeTool === 'arrow') {
                // Arrow is composed of a line and a triangle head
                state.tempShape = new fabric.Group([
                    new fabric.Line([0, 0, 0, 0], {
                        stroke: state.strokeColor,
                        strokeWidth: state.strokeWidth,
                        originX: 'center',
                        originY: 'center'
                    })
                ], {
                    left: state.startX,
                    top: state.startY,
                    selectable: false,
                    evented: false
                });
            } else if (state.activeTool === 'text') {
                state.isDrawingShape = false;
                const textObj = new fabric.Textbox('Double-click to type...', {
                    left: state.startX,
                    top: state.startY,
                    width: 150,
                    fontSize: 16,
                    fill: state.strokeColor,
                    fontFamily: "'Inter', sans-serif",
                    hasControls: true,
                    selectable: true,
                    evented: true
                });
                state.canvas.add(textObj);
                state.canvas.setActiveObject(textObj);
                textObj.enterEditing();
                
                // Return to select pointer
                document.getElementById(`btn-select-${getCanvasId(state)}`)?.click();
                return;
            }

            if (state.tempShape) {
                state.canvas.add(state.tempShape);
            }
        });

        state.canvas.on('mouse:move', o => {
            if (!state.isDrawingShape || !state.tempShape) return;

            const pointer = state.canvas.getPointer(o.e);
            const currX = pointer.x;
            const currY = pointer.y;

            const width = Math.abs(currX - state.startX);
            const height = Math.abs(currY - state.startY);
            const left = Math.min(state.startX, currX);
            const top = Math.min(state.startY, currY);

            if (state.activeTool === 'rect' || state.activeTool === 'triangle') {
                state.tempShape.set({
                    left: left,
                    top: top,
                    width: width,
                    height: height
                });
            } else if (state.activeTool === 'circle') {
                state.tempShape.set({
                    left: left,
                    top: top,
                    rx: width / 2,
                    ry: height / 2
                });
            } else if (state.activeTool === 'diamond') {
                // Redraw polygon vertices
                const centerLeft = width / 2;
                const centerTop = height / 2;
                state.tempShape.set({
                    left: left,
                    top: top,
                    points: [
                        { x: centerLeft, y: 0 },
                        { x: width, y: centerTop },
                        { x: centerLeft, y: height },
                        { x: 0, y: centerTop }
                    ]
                });
                state.tempShape.width = width;
                state.tempShape.height = height;
            } else if (state.activeTool === 'line') {
                state.tempShape.set({
                    x2: currX,
                    y2: currY
                });
            } else if (state.activeTool === 'arrow') {
                state.canvas.remove(state.tempShape);

                // Reconstruct Arrow in real time
                const dx = currX - state.startX;
                const dy = currY - state.startY;
                const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                const length = Math.sqrt(dx * dx + dy * dy);

                const lineObj = new fabric.Line([0, 0, length - 12, 0], {
                    stroke: state.strokeColor,
                    strokeWidth: state.strokeWidth,
                    originX: 'left',
                    originY: 'center',
                    top: 0,
                    left: 0
                });

                const headObj = new fabric.Triangle({
                    width: 12 + state.strokeWidth * 2,
                    height: 12 + state.strokeWidth * 2,
                    fill: state.strokeColor,
                    originX: 'center',
                    originY: 'center',
                    left: length - 6,
                    top: 0,
                    angle: 90
                });

                state.tempShape = new fabric.Group([lineObj, headObj], {
                    left: state.startX,
                    top: state.startY,
                    angle: angle,
                    originX: 'left',
                    originY: 'center',
                    selectable: false,
                    evented: false
                });

                state.canvas.add(state.tempShape);
            }

            state.canvas.renderAll();
        });

        state.canvas.on('mouse:up', () => {
            if (!state.isDrawingShape) return;

            state.isDrawingShape = false;

            if (state.tempShape) {
                // If shape is infinitesimally small, discard it
                if (state.activeTool !== 'line' && state.tempShape.width < 5 && state.tempShape.height < 5) {
                    state.canvas.remove(state.tempShape);
                } else {
                    // Upgrade shape to selectable pointer objects
                    state.tempShape.set({
                        selectable: true,
                        evented: true
                    });
                    
                    // Add text inside shape by default! Double clicking on a shape lets them write inside it.
                    // We also make sure the user returns back to Selection tool.
                    const qid = getCanvasId(state);
                    document.getElementById(`btn-select-${qid}`)?.click();
                }
            }

            state.tempShape = null;
            state.canvas.renderAll();
        });

        // Supporting writing inside shapes: Double click a shape to spawn a Textbox overlaying it!
        state.canvas.on('mouse:dblclick', o => {
            const target = o.target;
            if (target && target.type !== 'textbox') {
                // Create a text box inside this shape center!
                const center = target.getCenterPoint();
                const textObj = new fabric.Textbox('Type text...', {
                    left: center.x,
                    top: center.y,
                    width: Math.min(150, target.width - 20),
                    fontSize: 16,
                    fill: state.strokeColor,
                    originX: 'center',
                    originY: 'center',
                    fontFamily: "'Inter', sans-serif",
                    hasControls: true,
                    selectable: true,
                    evented: true
                });
                state.canvas.add(textObj);
                state.canvas.setActiveObject(textObj);
                textObj.enterEditing();
                textObj.selectAll();
                state.canvas.renderAll();
            }
        });
    }

    /**
     * Extracts the canvas ID from the active state container.
     */
    function getCanvasId(state) {
        for (let key in canvasStates) {
            if (canvasStates[key] === state) return key;
        }
        return 'paper-full';
    }

    /**
     * REST auto-save to Java Spring Boot database.
     */
    function saveCanvasToBackend(qid, state, attemptId, submissionId) {
        const json = JSON.stringify(state.canvas.toJSON(['id']));
        const image = state.canvas.toDataURL({
            format: 'png',
            quality: 1.0
        });

        const payload = {
            questionId: isNaN(qid) ? 999999L : parseInt(qid),
            canvasJson: json,
            canvasImage: image
        };

        if (attemptId && attemptId !== 'null') payload.attemptId = parseInt(attemptId);
        if (submissionId && submissionId !== 'null') payload.submissionId = parseInt(submissionId);

        fetch('/api/drawing/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'saved') {
                const statusEl = document.getElementById(`wb-save-status-${qid}`);
                if (statusEl) {
                    statusEl.className = 'badge bg-success-subtle text-success px-3 py-1.5 rounded-pill small';
                    statusEl.innerHTML = '<i class="fa-solid fa-cloud-arrow-up me-1"></i> Saved';
                }
            }
        })
        .catch(err => {
            console.error("Auto-save Whiteboard drawing failed:", err);
            const statusEl = document.getElementById(`wb-save-status-${qid}`);
            if (statusEl) {
                statusEl.className = 'badge bg-danger-subtle text-danger px-3 py-1.5 rounded-pill small';
                statusEl.innerHTML = '<i class="fa-solid fa-circle-exclamation me-1"></i> Offline';
            }
        });
    }

    /**
     * Restores canvas elements on page reload.
     */
    function loadCanvasFromBackend(qid, state, attemptId, submissionId) {
        let url = `/api/drawing/get?questionId=${isNaN(qid) ? 999999 : qid}`;
        if (attemptId && attemptId !== 'null') url += `&attemptId=${attemptId}`;
        if (submissionId && submissionId !== 'null') url += `&submissionId=${submissionId}`;

        fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.canvasJson) {
                state.canvas.loadFromJSON(data.canvasJson, () => {
                    state.canvas.renderAll();
                    // Set all objects as selectable
                    state.canvas.forEachObject(obj => {
                        obj.selectable = obj.evented = true;
                        obj.fromHistory = true;
                    });
                });
            }
        })
        .catch(err => console.error("Loading Whiteboard drawing failed:", err));
    }

    // Expose drawing engine globally
    window.initializeDrawingTool = initializeDrawingTool;

    // Auto-hook triggers on window load
    function init() {
        // Fetch submission/attempt IDs dynamically from the DOM hidden fields
        const subIdEl = document.getElementById('submissionId');
        const attIdEl = document.getElementById('attemptId');
        const typeEl = document.getElementById('type');
        
        let submissionId = subIdEl ? subIdEl.value : null;
        let attemptId = attIdEl ? attIdEl.value : null;
        const type = typeEl ? typeEl.value : null;

        if (type === 'paper' && attemptId) {
            submissionId = attemptId;
            attemptId = null;
        }

        // Auto-run delay to ensure textareas have been loaded
        setTimeout(() => {
            initializeDrawingTool(attemptId, submissionId);
        }, 1200);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
