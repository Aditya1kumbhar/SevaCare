'use client'

import React from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { FileDown } from 'lucide-react'

export default function PdfDownloadButton({ resident, healthRecords, logs }: { resident: any, healthRecords: any[], logs: any[] }) {
  
  const generatePDF = () => {
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(22)
    doc.text('SevaCare Health Report', 14, 20)
    
    // Resident Info
    doc.setFontSize(14)
    doc.text(`Resident Profile: ${resident.name}`, 14, 32)
    
    doc.setFontSize(11)
    doc.setTextColor(100)
    doc.text(`Age: ${resident.age} | Room: ${resident.room_number || 'N/A'} | Blood Group: ${resident.blood_group || 'N/A'}`, 14, 40)
    doc.text(`Family Contact: ${resident.family_contact_name} (${resident.family_phone_number})`, 14, 46)
    
    if (resident.life_threatening_allergies && resident.life_threatening_allergies !== 'None') {
      doc.setTextColor(220, 38, 38) // Red
      doc.text(`ALLERGY: ${resident.life_threatening_allergies}`, 14, 52)
      doc.setTextColor(100)
    }
    
    let y = resident.life_threatening_allergies && resident.life_threatening_allergies !== 'None' ? 58 : 52
    
    doc.text(`Mobility: ${resident.mobility_status || 'N/A'} | Comm: ${resident.communication_barrier || 'N/A'}`, 14, y)
    y += 6
    
    if (resident.wandering_risk) {
      doc.text('RISK: Wandering / Elopement Patient', 14, y)
      y += 6
    }
    
    if (resident.critical_conditions?.length > 0 && resident.critical_conditions[0] !== 'None') {
      doc.text(`Conditions: ${resident.critical_conditions.join(', ')}`, 14, y)
      y += 6
    }
    
    if (resident.aggression_triggers) {
      doc.text(`Aggression Triggers: ${resident.aggression_triggers}`, 14, y)
      y += 6
    }

    let yPos = y + 10

    // Health Records Table
    if (healthRecords && healthRecords.length > 0) {
      doc.setFontSize(14)
      doc.setTextColor(0)
      doc.text('Recent Health Records', 14, yPos)
      yPos += 6

      const healthTableData = healthRecords.map(h => [
        new Date(h.recorded_at).toLocaleDateString('en-IN'),
        h.blood_pressure || '-',
        h.heart_rate ? `${h.heart_rate} bpm` : '-',
        h.temperature ? `${h.temperature}°` : '-',
        h.oxygen_level ? `${h.oxygen_level}%` : '-',
        h.blood_sugar || '-',
        h.weight ? `${h.weight} kg` : '-'
      ])

      autoTable(doc, {
        startY: yPos,
        head: [['Date', 'BP', 'Heart Rate', 'Temp', 'SpO2', 'Sugar', 'Weight']],
        body: healthTableData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 10 }
      })
      
      yPos = (doc as any).lastAutoTable.finalY + 14
    }

    // Daily Logs Table
    if (logs && logs.length > 0) {
      doc.setFontSize(14)
      doc.setTextColor(0)
      doc.text('Recent Daily Status Logs', 14, yPos)
      yPos += 6

      const logsTableData = logs.map(l => [
        new Date(l.logged_at).toLocaleDateString('en-IN'),
        l.status.toUpperCase(),
        l.meal_taken ? 'Yes' : 'No',
        l.medication_taken ? 'Yes' : 'No',
        l.mood || '-',
        l.notes || '-'
      ])

      autoTable(doc, {
        startY: yPos,
        head: [['Date', 'Health Status', 'Meal', 'Meds', 'Mood', 'Notes']],
        body: logsTableData,
        theme: 'grid',
        headStyles: { fillColor: [46, 204, 113] },
        styles: { fontSize: 10 }
      })
    }

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages()
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, 14, doc.internal.pageSize.height - 10);
    }

    doc.save(`${resident.name.replace(/\s+/g, '_')}_SevaCare_Report.pdf`)
  }

  return (
    <button 
      onClick={generatePDF}
      className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-white text-blue-600 border-none transition-all w-full h-full"
    >
      <FileDown className="w-5 h-5 mb-1" />
      <span className="text-xs font-semibold tracking-tight text-slate-500">PDF REPORT</span>
    </button>
  )
}
