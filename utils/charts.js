export class MetricsChartEngine {
    constructor() {
        this.primaryChartInstance = null;
        this.ganttChartInstance = null;
    }

    buildPrimaryTimeline(ctx, labels, clouds, solar, qP, pP, pC, pI) {
        if (this.primaryChartInstance) this.primaryChartInstance.destroy();
        
        this.primaryChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Planet Cum P %', data: pP, borderColor: '#a855f7', borderWidth: 3, radius: 1, yAxisID: 'y' },
                    { label: 'Image Quality %', data: qP, borderColor: '#22c55e', borderWidth: 2, radius: 0, yAxisID: 'y' },
                    { label: 'Capella Cum P %', data: pC, borderColor: '#38bdf8', borderWidth: 1.5, borderDash: [3, 3], radius: 0, yAxisID: 'y' },
                    { label: 'ICEYE Cum P %', data: pI, borderColor: '#f43f5e', borderWidth: 1.5, borderDash: [5, 5], radius: 0, yAxisID: 'y' },
                    { label: 'Cloud Cover %', data: clouds, borderColor: '#475569', borderWidth: 1, radius: 0, yAxisID: 'y' },
                    { label: 'Solar Alt (°)', data: solar, borderColor: '#eab308', borderWidth: 1.5, borderDash: [6, 2], radius: 0, yAxisID: 'y1' }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: true, labels: { color: '#94a3b8', font: { size: 10 } } } },
                scales: {
                    x: { ticks: { color: '#64748b', font: { size: 9 } }, grid: { color: '#1e293b' } },
                    y: { min: 0, max: 100, ticks: { color: '#64748b' }, grid: { color: '#1e293b' } },
                    y1: { min: 0, max: 90, position: 'right', display: true, ticks: { color: '#eab308' }, grid: { drawOnChartArea: false } }
                }
            }
        });
    }

    buildGanttTimeline(ctx, labels, ganttData) {
        if (this.ganttChartInstance) this.ganttChartInstance.destroy();

        this.ganttChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Optical Preferred', data: ganttData.opt, backgroundColor: '#a855f7', barPercentage: 0.85 },
                    { label: 'SAR Mandatory', data: ganttData.sar, backgroundColor: '#38bdf8', barPercentage: 0.85 },
                    { label: 'Combined Opportunity', data: ganttData.comb, backgroundColor: '#22c55e', barPercentage: 0.85 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, labels: { color: '#94a3b8', font: { size: 10 } } },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label} (Relative Cost-Scale Factor: ${context.raw.toFixed(2)})`;
                            }
                        }
                    }
                },
                scales: {
                    x: { stacked: true, ticks: { color: '#64748b', font: { size: 9 } }, grid: { color: '#1e293b' } },
                    y: { stacked: true, display: false, min: 0, max: 6 } // Keeps proportional bars framed cleanly
                }
            }
        });
    }
}