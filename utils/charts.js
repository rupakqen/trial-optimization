export class MetricsChartEngine {
    constructor() {
        this.cloudChart = null;
        this.ganttChart = null;
    }

    buildPrimaryTimeline(ctx, labels, cloud, solar, qP, pP, pC, pI) {
        if (this.cloudChart) this.cloudChart.destroy();
        this.cloudChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Planet Cum P %', data: pP, borderColor: '#C084FC', borderWidth: 3, pointRadius: 2, yAxisID: 'y' },
                    { label: 'Planet Quality %', data: qP, borderColor: '#22C55E', borderWidth: 2, pointRadius: 0, yAxisID: 'y' },
                    { label: 'Capella Cum P %', data: pC, borderColor: '#38BDF8', borderWidth: 1.5, borderDash: [3, 3], pointRadius: 0, yAxisID: 'y' },
                    { label: 'ICEYE Cum P %', data: pI, borderColor: '#F43F5E', borderWidth: 1.5, borderDash: [5, 5], pointRadius: 0, yAxisID: 'y' },
                    { label: 'Clouds %', data: cloud, borderColor: '#64748B', borderWidth: 1, pointRadius: 0, yAxisID: 'y' },
                    { label: 'Solar Alt (°)', data: solar, borderColor: '#F59E0B', borderWidth: 1.2, borderDash: [6, 6], pointRadius: 0, yAxisID: 'y1' }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false, devicePixelRatio: 2,
                scales: {
                    x: { ticks: { color: '#F1F5F9', font: { size: 9, family: 'monospace', weight: 'bold' } }, grid: { color: '#334155' } },
                    y: { min: 0, max: 100, ticks: { color: '#F1F5F9', font: { weight: 'bold' } }, grid: { color: '#334155' } },
                    y1: { min: 0, max: 90, display: true, position: 'right', ticks: { color: '#F59E0B' }, grid: { drawOnChartArea: false } }
                },
                plugins: { legend: { labels: { color: '#F8FAFC', font: { size: 9, family: 'monospace', weight: 'bold' } } } }
            }
        });
    }

    buildGanttTimeline(ctx, labels, ganttData) {
        if (this.ganttChart) this.ganttChart.destroy();
        this.ganttChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Optical Preferred', data: ganttData.opt, backgroundColor: '#A855F7', barPercentage: 0.9 },
                    { label: 'SAR Mandatory', data: ganttData.sar, backgroundColor: '#38BDF8', barPercentage: 0.9 },
                    { label: 'Combined Target', data: ganttData.comb, backgroundColor: '#22C55E', barPercentage: 0.9 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false, devicePixelRatio: 2,
                indexAxis: 'x',
                scales: {
                    x: { stacked: true, ticks: { color: '#F1F5F9', font: { size: 9, family: 'monospace', weight: 'bold' } }, grid: { color: '#334155' } },
                    y: { stacked: true, min: 0, max: 3, display: false }
                },
                plugins: { legend: { labels: { color: '#F8FAFC', font: { size: 9, family: 'monospace', weight: 'bold' } } } }
            }
        });
    }
}