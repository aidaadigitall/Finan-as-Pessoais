
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Transaction, BankAccount } from '../types';

interface ExportOptions {
    fileName?: string;
    companyName?: string;
}

export const exportToPDF = (transactions: Transaction[], accounts: BankAccount[], options: ExportOptions = {}) => {
    const doc = new jsPDF();
    const companyName = options.companyName || 'FinAI - Relatório Financeiro';
    const fileName = options.fileName || 'relatorio_financeiro.pdf';
    
    doc.setFontSize(18);
    doc.text(companyName, 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 28);
    
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const balance = totalIncome - totalExpense;

    doc.setFillColor(245, 247, 250);
    doc.rect(14, 35, 180, 25, 'F');
    
    doc.setFontSize(10); doc.setTextColor(0); doc.text("Receitas", 20, 42);
    doc.setFontSize(12); doc.setTextColor(22, 163, 74); doc.text(`R$ ${totalIncome.toFixed(2)}`, 20, 50);

    doc.setFontSize(10); doc.setTextColor(0); doc.text("Despesas", 80, 42);
    doc.setFontSize(12); doc.setTextColor(220, 38, 38); doc.text(`R$ ${totalExpense.toFixed(2)}`, 80, 50);

    doc.setFontSize(10); doc.setTextColor(0); doc.text("Saldo Líquido", 140, 42);
    doc.setFontSize(12); doc.setTextColor(79, 70, 229); doc.text(`R$ ${balance.toFixed(2)}`, 140, 50);

    const tableColumn = ["Data", "Descrição", "Categoria", "Conta", "Valor", "Status"];
    const tableRows: any[] = [];

    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    sortedTransactions.forEach(t => {
        tableRows.push([
            new Date(t.date).toLocaleDateString('pt-BR'),
            t.description,
            t.category,
            accounts.find(a => a.id === t.accountId)?.name || '-',
            `R$ ${t.amount.toFixed(2)}`,
            t.isPaid ? 'Pago' : 'Pendente'
        ]);
    });

    autoTable(doc, {
        startY: 70,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 8, cellPadding: 3 },
    });

    doc.save(fileName);
};

export const exportToExcel = (transactions: Transaction[], accounts: BankAccount[], fileName = 'lancamentos.xlsx') => {
    const wsData = transactions.map(t => ({
        Data: new Date(t.date).toLocaleDateString('pt-BR'),
        Descrição: t.description,
        Categoria: t.category,
        Conta: accounts.find(a => a.id === t.accountId)?.name || '-',
        Valor: t.amount,
        Status: t.isPaid ? 'Pago' : 'Pendente'
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lançamentos");
    XLSX.writeFile(wb, fileName);
};
