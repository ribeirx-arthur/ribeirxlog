import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Trip, Vehicle, Driver, UserProfile } from '../types';
import { calculateTripFinance } from './finance';

export const generateTripReceipt = (
    trip: Trip,
    vehicle: Vehicle,
    driver: Driver,
    profile: UserProfile
) => {
    const finance = calculateTripFinance(trip, vehicle, driver, profile);
    const doc = new jsPDF();

    // Header
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('RECIBO DE VIAGEM', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ribeirx Log - Sistema de Gestão Logística`, 105, 30, { align: 'center' });

    // Trip Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMAÇÕES DA VIAGEM', 20, 55);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const tripInfo = [
        ['ID da Viagem:', trip.id],
        ['Destino:', trip.destination || 'Não informado'],
        ['Data de Saída:', new Date(trip.departureDate).toLocaleDateString('pt-BR')],
        ['Data de Retorno:', trip.returnDate ? new Date(trip.returnDate).toLocaleDateString('pt-BR') : 'Não informado'],
        ['Veículo:', `${vehicle.plate} - ${vehicle.name}`],
        ['Motorista:', driver.name],
        ['Quilometragem:', `${trip.totalKm || 0} km`],
        ['Status:', trip.status],
    ];

    let yPos = 65;
    tripInfo.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(String(value), 80, yPos);
        yPos += 7;
    });

    // Financial Details
    yPos += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALHAMENTO FINANCEIRO', 20, yPos);
    yPos += 10;

    const totalDespesas = finance.comissaoMotorista + trip.combustivel + trip.outrasDespesas;

    autoTable(doc, {
        startY: yPos,
        head: [['Descrição', 'Valor (R$)']],
        body: [
            ['Frete Seco', trip.freteSeco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })],
            ['Diárias', trip.diarias.toLocaleString('pt-BR', { minimumFractionDigits: 2 })],
            ['Total Bruto', finance.totalBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })],
            ['', ''],
            ['Combustível', `(${trip.combustivel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`],
            ['Adiantamento', `(${trip.adiantamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`],
            ['Comissão Motorista', `(${finance.comissaoMotorista.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`],
            ['Outras Despesas', `(${trip.outrasDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`],
            ['Total Despesas', `(${totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`],
            ['', ''],
            ['SALDO DO ADIANTAMENTO', finance.saldoAdiantamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })],
        ],
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 10 },
    });

    // Profit Summary
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFillColor(240, 253, 244);
    doc.rect(20, finalY, 170, 30, 'F');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text('LUCRO LÍQUIDO REAL:', 25, finalY + 12);
    doc.setFontSize(18);
    doc.text(`R$ ${finance.lucroLiquidoReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 25, finalY + 24);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'italic');
    doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')} via Ribeirx Log`, 105, 280, { align: 'center' });

    doc.save(`Recibo_Viagem_${trip.id}_${vehicle.plate}.pdf`);
};

export const generateMonthlyReport = (
    trips: Trip[],
    vehicles: Vehicle[],
    drivers: Driver[],
    profile: UserProfile,
    month: string, // formato: "2026-02"
    year: string
) => {
    const doc = new jsPDF();

    // Header
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, 210, 50, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.text('RELATÓRIO MENSAL', 105, 22, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const monthIndex = parseInt(month.split('-')[1]) - 1;
    doc.text(`${monthNames[monthIndex]} de ${year}`, 105, 35, { align: 'center' });
    doc.text(`Ribeirx Log - Gestão Inteligente`, 105, 43, { align: 'center' });

    // Filter trips by month
    const monthlyTrips = trips.filter(t => {
        const tripDate = new Date(t.departureDate);
        return tripDate.getMonth() === monthIndex && tripDate.getFullYear() === parseInt(year);
    });

    // Calculate totals
    let totalProfit = 0;
    let totalGross = 0;
    let totalExpenses = 0;
    let totalKm = 0;

    const tripDetails = monthlyTrips.map(trip => {
        const vehicle = vehicles.find(v => v.id === trip.vehicleId);
        const driver = drivers.find(d => d.id === trip.driverId);

        if (!vehicle || !driver) return null;

        const finance = calculateTripFinance(trip, vehicle, driver, profile);
        const expenses = finance.comissaoMotorista + trip.combustivel + trip.outrasDespesas;

        totalProfit += finance.lucroLiquidoReal;
        totalGross += finance.totalBruto;
        totalExpenses += expenses;
        totalKm += trip.totalKm || 0;

        return [
            new Date(trip.departureDate).toLocaleDateString('pt-BR'),
            vehicle.plate,
            trip.destination || 'N/A',
            `${trip.totalKm || 0} km`,
            `R$ ${finance.totalBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            `R$ ${finance.lucroLiquidoReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        ];
    }).filter(Boolean);

    // Summary Cards
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');

    const summaryY = 65;
    const cardWidth = 85;
    const cardHeight = 25;

    // Card 1: Total Viagens
    doc.setFillColor(240, 253, 244);
    doc.rect(20, summaryY, cardWidth, cardHeight, 'F');
    doc.text('TOTAL DE VIAGENS', 25, summaryY + 8);
    doc.setFontSize(20);
    doc.setTextColor(16, 185, 129);
    doc.text(String(monthlyTrips.length), 25, summaryY + 20);

    // Card 2: Lucro Total
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFillColor(254, 249, 195);
    doc.rect(110, summaryY, cardWidth, cardHeight, 'F');
    doc.text('LUCRO LÍQUIDO TOTAL', 115, summaryY + 8);
    doc.setFontSize(16);
    doc.setTextColor(202, 138, 4);
    doc.text(`R$ ${totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 115, summaryY + 20);

    // Card 3: Receita Bruta
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFillColor(239, 246, 255);
    doc.rect(20, summaryY + 30, cardWidth, cardHeight, 'F');
    doc.text('RECEITA BRUTA', 25, summaryY + 38);
    doc.setFontSize(16);
    doc.setTextColor(37, 99, 235);
    doc.text(`R$ ${totalGross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 25, summaryY + 50);

    // Card 4: Total KM
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFillColor(254, 242, 242);
    doc.rect(110, summaryY + 30, cardWidth, cardHeight, 'F');
    doc.text('QUILOMETRAGEM TOTAL', 115, summaryY + 38);
    doc.setFontSize(16);
    doc.setTextColor(220, 38, 38);
    doc.text(`${totalKm.toLocaleString('pt-BR')} km`, 115, summaryY + 50);

    // Trips Table
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALHAMENTO DE VIAGENS', 20, summaryY + 70);

    autoTable(doc, {
        startY: summaryY + 78,
        head: [['Data', 'Veículo', 'Destino', 'KM', 'Receita', 'Lucro']],
        body: tripDetails.length > 0 ? tripDetails : [['Nenhuma viagem registrada neste período', '', '', '', '', '']],
        theme: 'grid',
        headStyles: {
            fillColor: [16, 185, 129],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9
        },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 25 },
            2: { cellWidth: 45 },
            3: { cellWidth: 20 },
            4: { cellWidth: 35 },
            5: { cellWidth: 35 },
        },
    });

    // Footer with totals
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFillColor(16, 185, 129);
    doc.rect(20, finalY, 170, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`MARGEM DE LUCRO: ${totalGross > 0 ? ((totalProfit / totalGross) * 100).toFixed(2) : 0}%`, 25, finalY + 10);
    doc.text(`CUSTO MÉDIO/KM: R$ ${totalKm > 0 ? (totalExpenses / totalKm).toFixed(2) : '0.00'}`, 130, finalY + 10);

    // Document footer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'italic');
    doc.text(`Relatório gerado em ${new Date().toLocaleString('pt-BR')} | Ribeirx Log v3.1`, 105, 285, { align: 'center' });

    doc.save(`Relatorio_Mensal_${monthNames[monthIndex]}_${year}.pdf`);
};
