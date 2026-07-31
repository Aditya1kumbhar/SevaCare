'use client'

import React from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { FileDown } from 'lucide-react'

export default function PdfDownloadButton({ resident, healthRecords, logs }: { resident: any, healthRecords: any[], logs: any[] }) {
  
  const generatePDF = () => {
    const doc = new jsPDF()
    
    // --- BRANDING & LETTERHEAD ---
    // Background header bar (Deep Blue)
    doc.setFillColor(30, 58, 138) // Tailwind blue-900
    doc.rect(0, 0, doc.internal.pageSize.width, 35, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('SEVACARE', 14, 20)
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('ELDERLY CARE MANAGEMENT FACILITY', 14, 28)
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('CONFIDENTIAL MEDICAL RECORD', doc.internal.pageSize.width - 85, 20)
    
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`DATE GENERATED: ${new Date().toLocaleDateString('en-IN').toUpperCase()}`, doc.internal.pageSize.width - 85, 28)
    
    // Reset Text Color for body
    doc.setTextColor(30, 41, 59) // slate-800
    
    // --- PATIENT IDENTITY BLOCK ---
    let yPos = 45
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('PATIENT IDENTITY & SUMMARY', 14, yPos)
    
    yPos += 8
    
    // Profile Box
    doc.setDrawColor(203, 213, 225) // slate-300
    doc.setFillColor(248, 250, 252) // slate-50
    doc.roundedRect(14, yPos, doc.internal.pageSize.width - 28, 48, 2, 2, 'FD')
    
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    yPos += 8
    doc.text(`FULL NAME:`, 18, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(`${resident.name}`, 45, yPos)
    
    doc.setFont('helvetica', 'bold')
    doc.text(`ROOM:`, 130, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(`${resident.room_number || 'UNASSIGNED'}`, 146, yPos)
    
    yPos += 8
    doc.setFont('helvetica', 'bold')
    doc.text(`AGE:`, 18, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(`${resident.age} YRS`, 45, yPos)
    
    doc.setFont('helvetica', 'bold')
    doc.text(`BLOOD GRP:`, 130, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(`${resident.blood_group || 'UNKNOWN'}`, 155, yPos)
    
    yPos += 8
    doc.setFont('helvetica', 'bold')
    doc.text(`EMERGENCY CONTACT:`, 18, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(`${resident.family_contact_name} | ${resident.family_phone_number}`, 65, yPos)
    
    yPos += 8
    doc.setFont('helvetica', 'bold')
    doc.text(`NOTES/CONDITIONS:`, 18, yPos)
    doc.setFont('helvetica', 'normal')
    
    const conditions = []
    if (resident.critical_conditions?.length > 0 && resident.critical_conditions[0] !== 'None') conditions.push(resident.critical_conditions.join(', '))
    if (resident.mobility_status) conditions.push(`Mobility: ${resident.mobility_status}`)
    if (resident.communication_barrier) conditions.push(`Communication: ${resident.communication_barrier}`)
    
    const conditionsText = conditions.length > 0 ? conditions.join(' | ') : 'No critical notes.'
    doc.text(doc.splitTextToSize(conditionsText, 130), 65, yPos)

    yPos += 14 // push past box

    // --- ALERTS BLOCK ---
    const activeAlerts = []
    if (resident.life_threatening_allergies && resident.life_threatening_allergies !== 'None') {
        activeAlerts.push(`ALLERGY AVOIDANCE: ${resident.life_threatening_allergies}`)
    }
    if (resident.wandering_risk) {
        activeAlerts.push('WANDERING RISK ALARM')
    }
    if (resident.aggression_triggers) {
        activeAlerts.push(`BEHAVIOR TRIGGERS: ${resident.aggression_triggers}`)
    }

    if (activeAlerts.length > 0) {
        yPos += 4
        doc.setFillColor(254, 226, 226) // red-100
        doc.setDrawColor(248, 113, 113) // red-400
        doc.rect(14, yPos, doc.internal.pageSize.width - 28, 10 + (activeAlerts.length * 6), 'FD')
        
        doc.setTextColor(153, 27, 27) // red-800
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        let alertY = yPos + 6
        doc.text(' CRITICAL MEDICAL ALERTS:', 16, alertY)
        alertY += 6
        
        doc.setFont('helvetica', 'normal')
        activeAlerts.forEach(alert => {
            doc.text(`• ${alert.toUpperCase()}`, 18, alertY)
            alertY += 6
        })
        yPos = alertY + 4
        doc.setTextColor(30, 41, 59) // reset text
    } else {
        yPos += 4
    }

    // --- VITALS TABLE ---
    if (healthRecords && healthRecords.length > 0) {
      yPos += 8
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('LATEST VITALS SIGNATURES', 14, yPos)
      yPos += 4

      const healthTableData = healthRecords.map(h => [
        new Date(h.recorded_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        h.blood_pressure || '--/--',
        h.heart_rate ? `${h.heart_rate} BPM` : '--',
        h.temperature ? `${h.temperature}°` : '--',
        h.oxygen_level ? `${h.oxygen_level}%` : '--',
        h.blood_sugar ? `${h.blood_sugar}%` : '--',
        h.weight ? `${h.weight} KG` : '--'
      ])

      autoTable(doc, {
        startY: yPos,
        head: [['TIMESTAMP', 'B.P. SYS/DIA', 'HEART RATE', 'TEMP', 'SPO2', 'SUGAR', 'WEIGHT']],
        body: healthTableData,
        theme: 'grid',
        headStyles: { fillColor: [30, 64, 175], fontStyle: 'bold', fontSize: 9, halign: 'center' }, // blue-800
        bodyStyles: { fontSize: 10, textColor: [30, 41, 59], halign: 'center', cellPadding: 3 }, // readable large text
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { font: 'helvetica', lineColor: [203, 213, 225] }
      })
      
      yPos = (doc as any).lastAutoTable.finalY + 12
    }

    // --- DAILY LOGS TABLE ---
    if (logs && logs.length > 0) {
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('CARETAKER ROTATIONAL LOGS', 14, yPos)
      yPos += 4

      const logsTableData = logs.map(l => [
        new Date(l.logged_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        l.status.toUpperCase(),
        l.meal_taken ? 'ADMINISTERED' : 'REFUSED/SKIP',
        l.medication_taken ? 'ADMINISTERED' : 'REFUSED/SKIP',
        l.mood ? l.mood.toUpperCase() : 'N/A',
        l.notes ? l.notes.substring(0, 60) + (l.notes.length > 60 ? '...' : '') : '-' // Enforce length limit for legibility
      ])

      autoTable(doc, {
        startY: yPos,
        head: [['TIMESTAMP', 'STATUS', 'MEAL ADMIN', 'MEDS ADMIN', 'EVAL. MOOD', 'CLINICAL NOTES']],
        body: logsTableData,
        theme: 'grid',
        headStyles: { fillColor: [15, 118, 110], fontStyle: 'bold', fontSize: 9, halign: 'center' }, // teal-700
        bodyStyles: { fontSize: 9, textColor: [30, 41, 59], cellPadding: 3 },
        columnStyles: { 
            0: { halign: 'center', cellWidth: 35 }, 
            1: { halign: 'center', cellWidth: 20 },
            4: { halign: 'center', cellWidth: 25 },
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { font: 'helvetica', lineColor: [203, 213, 225] }
      })
    }

    // --- FOOTER PAGINATION ---
    const pageCount = (doc as any).internal.getNumberOfPages()
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.setFont('helvetica', 'normal');
        doc.text('This document contains sensitive medical information. Unauthorized sharing/distribution is prohibited.', 14, doc.internal.pageSize.height - 15);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 15);
        
        // Bottom border line
        doc.setDrawColor(226, 232, 240);
        doc.line(14, doc.internal.pageSize.height - 20, doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 20);
    }

    doc.save(`${resident.name.replace(/\s+/g, '_')}_SevaCare_Official_Report.pdf`)
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
