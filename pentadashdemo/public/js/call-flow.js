/**
 * Interactive Call Flow Diagram
 * Real-time visualization of call routing with drop rate indicators
 */

class CallFlowDiagram {
    constructor(svgElementId, config = {}) {
        this.svg = document.getElementById(svgElementId);
        this.config = {
            width: config.width || 1400,
            height: config.height || 800,
            nodeWidth: 140,
            nodeHeight: 80,
            spacing: {
                horizontal: 200,
                vertical: 120
            },
            colors: {
                trunk: '#0052CC',
                ivr: '#9C27B0',
                queue: '#FF9800',
                agent: '#00C48C',
                voicemail: '#607D8B',
                external: '#E91E63',
                active: '#00D4FF',
                highDrop: '#F44336',
                mediumDrop: '#FF9800',
                lowDrop: '#4CAF50'
            },
            ...config
        };

        this.nodes = [];
        this.connections = [];
        this.activeCall

s = new Map();
        this.dropStats = new Map();

        this.init();
    }

    init() {
        // Set SVG dimensions
        this.svg.setAttribute('width', this.config.width);
        this.svg.setAttribute('height', this.config.height);
        this.svg.setAttribute('viewBox', `0 0 ${this.config.width} ${this.config.height}`);

        // Create defs for patterns and gradients
        this.createDefs();

        // Build Pentanet call flow
        this.buildPentanetFlow();

        // Render initial state
        this.render();

        // Start update loop
        this.startUpdateLoop();
    }

    createDefs() {
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

        // Gradient for active calls
        const activeGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        activeGradient.setAttribute('id', 'activeCallGradient');
        activeGradient.innerHTML = `
            <stop offset="0%" style="stop-color:${this.config.colors.active};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${this.config.colors.active};stop-opacity:0.3" />
        `;
        defs.appendChild(activeGradient);

        // Arrow markers
        const markers = [
            { id: 'arrowNormal', color: '#A0AEC0' },
            { id: 'arrowActive', color: this.config.colors.active },
            { id: 'arrowHighDrop', color: this.config.colors.highDrop }
        ];

        markers.forEach(({ id, color }) => {
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            marker.setAttribute('id', id);
            marker.setAttribute('markerWidth', '10');
            marker.setAttribute('markerHeight', '10');
            marker.setAttribute('refX', '9');
            marker.setAttribute('refY', '3');
            marker.setAttribute('orient', 'auto');
            marker.innerHTML = `<path d="M0,0 L0,6 L9,3 z" fill="${color}" />`;
            defs.appendChild(marker);
        });

        this.svg.appendChild(defs);
    }

    buildPentanetFlow() {
        // Layer 1: Trunk/DIDs
        const trunks = [
            { id: 'trunk-virtutel', label: 'Virtutel Trunk', did: '(08) 6118 9000', x: 100, y: 100 },
            { id: 'did-investor', label: 'Investor Line', did: '1300 855 897', x: 100, y: 250 },
            { id: 'did-noc', label: 'NOC Support', did: '(08) 6465 0000', x: 100, y: 400 },
            { id: 'did-delivery', label: 'Delivery', did: '(08) 6118 9001', x: 100, y: 550 }
        ];

        trunks.forEach(trunk => {
            this.addNode({
                ...trunk,
                type: 'trunk',
                stats: { total: 0, active: 0, dropped: 0 }
            });
        });

        // Layer 2: IVR/Digital Receptionist
        this.addNode({
            id: 'ivr-main',
            label: 'Main IVR',
            detail: 'Digital Receptionist',
            type: 'ivr',
            x: 400,
            y: 100,
            stats: { total: 0, active: 0, dropped: 0 }
        });

        // Layer 3: Queues
        const queues = [
            { id: 'queue-investor', label: 'Investor Queue', did: '1300 855 897', x: 700, y: 250 },
            { id: 'queue-noc', label: 'NOC Queue', did: '(08) 6465 0000', x: 700, y: 400 },
            { id: 'queue-delivery', label: 'Delivery Queue', did: '(08) 6118 9001', x: 700, y: 550 }
        ];

        queues.forEach(queue => {
            this.addNode({
                ...queue,
                type: 'queue',
                stats: { total: 0, waiting: 0, active: 0, dropped: 0 }
            });
        });

        // Layer 4: Agent Groups
        const agentGroups = [
            { id: 'agents-investor', label: 'Investor Agents', agents: 3, x: 1000, y: 250 },
            { id: 'agents-noc', label: 'NOC Agents', agents: 5, x: 1000, y: 400 },
            { id: 'agents-delivery', label: 'Delivery Agents', agents: 4, x: 1000, y: 550 }
        ];

        agentGroups.forEach(group => {
            this.addNode({
                ...group,
                type: 'agent',
                stats: { available: 0, oncall: 0, total: group.agents }
            });
        });

        // Layer 5: Voicemail
        const voicemails = [
            { id: 'vm-investor', label: 'Investor VM', x: 1250, y: 250 },
            { id: 'vm-noc', label: 'NOC VM', x: 1250, y: 400 },
            { id: 'vm-delivery', label: 'Delivery VM', x: 1250, y: 550 }
        ];

        voicemails.forEach(vm => {
            this.addNode({
                ...vm,
                type: 'voicemail',
                stats: { messages: 0 }
            });
        });

        // Define connections
        this.addConnection('trunk-virtutel', 'ivr-main', 'All inbound');
        this.addConnection('did-investor', 'queue-investor', 'Direct');
        this.addConnection('did-noc', 'queue-noc', 'Direct');
        this.addConnection('did-delivery', 'queue-delivery', 'Direct');

        this.addConnection('ivr-main', 'queue-investor', 'Press 1');
        this.addConnection('ivr-main', 'queue-noc', 'Press 2');
        this.addConnection('ivr-main', 'queue-delivery', 'Press 3');

        this.addConnection('queue-investor', 'agents-investor', 'Available');
        this.addConnection('queue-noc', 'agents-noc', 'Available');
        this.addConnection('queue-delivery', 'agents-delivery', 'Available');

        this.addConnection('queue-investor', 'vm-investor', 'Timeout/After hours');
        this.addConnection('queue-noc', 'vm-noc', 'Timeout/After hours');
        this.addConnection('queue-delivery', 'vm-delivery', 'Timeout/After hours');

        this.addConnection('agents-investor', 'vm-investor', 'No answer');
        this.addConnection('agents-noc', 'vm-noc', 'No answer');
        this.addConnection('agents-delivery', 'vm-delivery', 'No answer');
    }

    addNode(node) {
        this.nodes.push(node);
    }

    addConnection(from, to, label = '') {
        this.connections.push({
            from,
            to,
            label,
            stats: { count: 0, dropped: 0, active: 0 }
        });
    }

    render() {
        // Clear SVG (except defs)
        const defs = this.svg.querySelector('defs');
        this.svg.innerHTML = '';
        if (defs) this.svg.appendChild(defs);

        // Create connection group (render first so nodes appear on top)
        const connectionsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        connectionsGroup.setAttribute('class', 'connections');
        this.svg.appendChild(connectionsGroup);

        // Render connections
        this.connections.forEach(conn => {
            this.renderConnection(connectionsGroup, conn);
        });

        // Create nodes group
        const nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        nodesGroup.setAttribute('class', 'nodes');
        this.svg.appendChild(nodesGroup);

        // Render nodes
        this.nodes.forEach(node => {
            this.renderNode(nodesGroup, node);
        });
    }

    renderNode(parent, node) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', `node node-${node.type}`);
        group.setAttribute('data-id', node.id);
        group.setAttribute('transform', `translate(${node.x}, ${node.y})`);

        // Node background
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', this.config.nodeWidth);
        rect.setAttribute('height', this.config.nodeHeight);
        rect.setAttribute('rx', '8');
        rect.setAttribute('fill', this.getNodeColor(node));
        rect.setAttribute('stroke', this.getNodeBorderColor(node));
        rect.setAttribute('stroke-width', '2');
        group.appendChild(rect);

        // Node icon (using text emoji for simplicity)
        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        icon.setAttribute('x', '15');
        icon.setAttribute('y', '30');
        icon.setAttribute('font-size', '24');
        icon.textContent = this.getNodeIcon(node.type);
        group.appendChild(icon);

        // Node label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', '45');
        label.setAttribute('y', '28');
        label.setAttribute('fill', '#E2E8F0');
        label.setAttribute('font-size', '13');
        label.setAttribute('font-weight', '600');
        label.textContent = node.label;
        group.appendChild(label);

        // Node detail (DID or description)
        if (node.did || node.detail) {
            const detail = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            detail.setAttribute('x', '45');
            detail.setAttribute('y', '45');
            detail.setAttribute('fill', '#A0AEC0');
            detail.setAttribute('font-size', '11');
            detail.textContent = node.did || node.detail;
            group.appendChild(detail);
        }

        // Stats display
        const stats = this.getNodeStatsText(node);
        const statsText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        statsText.setAttribute('x', '10');
        statsText.setAttribute('y', '68');
        statsText.setAttribute('fill', '#00D4FF');
        statsText.setAttribute('font-size', '12');
        statsText.setAttribute('font-weight', '600');
        statsText.textContent = stats;
        group.appendChild(statsText);

        // Click handler
        group.style.cursor = 'pointer';
        group.addEventListener('click', () => this.handleNodeClick(node));

        // Hover effect
        group.addEventListener('mouseenter', () => {
            rect.setAttribute('stroke-width', '3');
            rect.setAttribute('filter', 'drop-shadow(0 0 8px rgba(0, 212, 255, 0.6))');
        });

        group.addEventListener('mouseleave', () => {
            rect.setAttribute('stroke-width', '2');
            rect.setAttribute('filter', '');
        });

        parent.appendChild(group);
    }

    renderConnection(parent, conn) {
        const fromNode = this.nodes.find(n => n.id === conn.from);
        const toNode = this.nodes.find(n => n.id === conn.to);

        if (!fromNode || !toNode) return;

        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'connection');

        // Calculate connection points
        const x1 = fromNode.x + this.config.nodeWidth;
        const y1 = fromNode.y + this.config.nodeHeight / 2;
        const x2 = toNode.x;
        const y2 = toNode.y + this.config.nodeHeight / 2;

        // Determine connection style based on stats
        const dropRate = conn.stats.count > 0
            ? (conn.stats.dropped / conn.stats.count) * 100
            : 0;

        let strokeColor = '#A0AEC0';
        let strokeWidth = 2;
        let markerEnd = 'url(#arrowNormal)';

        if (conn.stats.active > 0) {
            strokeColor = this.config.colors.active;
            strokeWidth = 3;
            markerEnd = 'url(#arrowActive)';
        } else if (dropRate > 20) {
            strokeColor = this.config.colors.highDrop;
            strokeWidth = 3;
            markerEnd = 'url(#arrowHighDrop)';
        } else if (dropRate > 10) {
            strokeColor = this.config.colors.mediumDrop;
            strokeWidth = 2.5;
        }

        // Draw path
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = this.createCurvedPath(x1, y1, x2, y2);
        path.setAttribute('d', d);
        path.setAttribute('stroke', strokeColor);
        path.setAttribute('stroke-width', strokeWidth);
        path.setAttribute('fill', 'none');
        path.setAttribute('marker-end', markerEnd);

        // Animate active calls
        if (conn.stats.active > 0) {
            path.setAttribute('stroke-dasharray', '10,5');
            const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
            animate.setAttribute('attributeName', 'stroke-dashoffset');
            animate.setAttribute('from', '15');
            animate.setAttribute('to', '0');
            animate.setAttribute('dur', '1s');
            animate.setAttribute('repeatCount', 'indefinite');
            path.appendChild(animate);
        }

        group.appendChild(path);

        // Connection label
        if (conn.label) {
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2 - 10;

            const labelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            labelBg.setAttribute('x', midX - 40);
            labelBg.setAttribute('y', midY - 12);
            labelBg.setAttribute('width', '80');
            labelBg.setAttribute('height', '20');
            labelBg.setAttribute('rx', '4');
            labelBg.setAttribute('fill', '#1A2332');
            labelBg.setAttribute('stroke', strokeColor);
            labelBg.setAttribute('stroke-width', '1');
            group.appendChild(labelBg);

            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', midX);
            label.setAttribute('y', midY + 2);
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('fill', '#A0AEC0');
            label.setAttribute('font-size', '10');
            label.textContent = conn.label;
            group.appendChild(label);
        }

        // Drop rate indicator (if significant)
        if (dropRate > 10) {
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2 + 15;

            const dropLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            dropLabel.setAttribute('x', midX);
            dropLabel.setAttribute('y', midY);
            dropLabel.setAttribute('text-anchor', 'middle');
            dropLabel.setAttribute('fill', this.config.colors.highDrop);
            dropLabel.setAttribute('font-size', '11');
            dropLabel.setAttribute('font-weight', '600');
            dropLabel.textContent = `⚠ ${Math.round(dropRate)}% drop`;
            group.appendChild(dropLabel);
        }

        parent.appendChild(group);
    }

    createCurvedPath(x1, y1, x2, y2) {
        const midX = (x1 + x2) / 2;
        return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
    }

    getNodeColor(node) {
        if (node.stats && node.stats.active > 0) {
            return 'rgba(0, 212, 255, 0.2)';
        }

        const baseColors = {
            trunk: 'rgba(0, 82, 204, 0.2)',
            ivr: 'rgba(156, 39, 176, 0.2)',
            queue: 'rgba(255, 152, 0, 0.2)',
            agent: 'rgba(0, 196, 140, 0.2)',
            voicemail: 'rgba(96, 125, 139, 0.2)',
            external: 'rgba(233, 30, 99, 0.2)'
        };

        return baseColors[node.type] || 'rgba(160, 174, 192, 0.2)';
    }

    getNodeBorderColor(node) {
        if (node.stats && node.stats.active > 0) {
            return this.config.colors.active;
        }

        return this.config.colors[node.type] || '#A0AEC0';
    }

    getNodeIcon(type) {
        const icons = {
            trunk: '📞',
            ivr: '🤖',
            queue: '⏳',
            agent: '👤',
            voicemail: '📧',
            external: '🌐'
        };

        return icons[type] || '●';
    }

    getNodeStatsText(node) {
        switch (node.type) {
            case 'trunk':
            case 'ivr':
                return node.stats.active > 0
                    ? `🔴 ${node.stats.active} active`
                    : `${node.stats.total} today`;

            case 'queue':
                return node.stats.waiting > 0
                    ? `⏳ ${node.stats.waiting} waiting`
                    : node.stats.active > 0
                        ? `🔴 ${node.stats.active} active`
                        : `${node.stats.total} today`;

            case 'agent':
                return `${node.stats.available}/${node.stats.total} available`;

            case 'voicemail':
                return `${node.stats.messages} messages`;

            default:
                return '';
        }
    }

    handleNodeClick(node) {
        console.log('Node clicked:', node);
        // Show detailed node stats modal
        this.showNodeDetails(node);
    }

    showNodeDetails(node) {
        // Implementation: Show modal with detailed stats
        alert(`${node.label}\n\nStats: ${JSON.stringify(node.stats, null, 2)}`);
    }

    updateNodeStats(nodeId, stats) {
        const node = this.nodes.find(n => n.id === nodeId);
        if (node) {
            node.stats = { ...node.stats, ...stats };
            this.render();
        }
    }

    updateConnectionStats(from, to, stats) {
        const conn = this.connections.find(c => c.from === from && c.to === to);
        if (conn) {
            conn.stats = { ...conn.stats, ...stats };
            this.render();
        }
    }

    simulateRealTimeData() {
        // Simulate random call activity
        const activeNodes = ['trunk-virtutel', 'ivr-main', 'queue-investor', 'queue-noc', 'queue-delivery'];

        activeNodes.forEach(nodeId => {
            const node = this.nodes.find(n => n.id === nodeId);
            if (node) {
                node.stats.active = Math.floor(Math.random() * 5);
                node.stats.total += Math.floor(Math.random() * 3);
            }
        });

        // Simulate queue waiting
        const queues = this.nodes.filter(n => n.type === 'queue');
        queues.forEach(queue => {
            queue.stats.waiting = Math.floor(Math.random() * 4);
        });

        // Simulate agent availability
        const agents = this.nodes.filter(n => n.type === 'agent');
        agents.forEach(agent => {
            agent.stats.available = Math.floor(Math.random() * (agent.stats.total + 1));
            agent.stats.oncall = agent.stats.total - agent.stats.available;
        });

        // Simulate connections with drop rates
        this.connections.forEach(conn => {
            conn.stats.count += Math.floor(Math.random() * 10);
            conn.stats.dropped += Math.floor(Math.random() * 2);
            conn.stats.active = Math.random() > 0.7 ? Math.floor(Math.random() * 3) : 0;
        });

        this.render();
    }

    startUpdateLoop() {
        // Update every 3 seconds
        setInterval(() => {
            this.simulateRealTimeData();
        }, 3000);
    }

    reset() {
        this.nodes.forEach(node => {
            if (node.stats) {
                Object.keys(node.stats).forEach(key => {
                    if (key !== 'total' && key !== 'agents') {
                        node.stats[key] = 0;
                    }
                });
            }
        });

        this.connections.forEach(conn => {
            conn.stats = { count: 0, dropped: 0, active: 0 };
        });

        this.render();
    }

    exportToPDF() {
        // Implementation: Export SVG to PDF
        const svgData = new XMLSerializer().serializeToString(this.svg);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `call-flow-${Date.now()}.svg`;
        link.click();

        URL.revokeObjectURL(url);
    }
}

// Initialize call flow diagram
let callFlowDiagram;

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('call-flow-svg')) {
        callFlowDiagram = new CallFlowDiagram('call-flow-svg');
    }
});

// Global functions for HTML event handlers
function resetCallFlowZoom() {
    if (callFlowDiagram) {
        callFlowDiagram.reset();
    }
}

function exportCallFlowPDF() {
    if (callFlowDiagram) {
        callFlowDiagram.exportToPDF();
    }
}

function toggleLiveCalls() {
    // Toggle live call display
    const checkbox = document.getElementById('show-live-calls');
    console.log('Show live calls:', checkbox.checked);
}
