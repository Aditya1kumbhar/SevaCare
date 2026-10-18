'use client'

import React, { useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { FileDown, Loader2 } from 'lucide-react'

let cachedFontBase64: string | null = null

async function loadUnicodeFont(doc: jsPDF): Promise<string> {
  try {
    if (cachedFontBase64) {
      doc.addFileToVFS('NotoSansDevanagari.ttf', cachedFontBase64)
      doc.addFont('NotoSansDevanagari.ttf', 'Devanagari', 'normal')
      return 'Devanagari'
    }

    if (typeof window !== 'undefined' && navigator.onLine) {
      const response = await fetch(
        'https://fonts.gstatic.com/s/notosansdevanagari/v27/8vlq7Z5A73qG6y1Sh6y7G26PVD7b.ttf',
        { signal: AbortSignal.timeout(3000) }
      )
      if (response.ok) {
        const buffer = await response.arrayBuffer()
        let binary = ''
        const bytes = new Uint8Array(buffer)
        const len = bytes.byteLength
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i])
        }
        cachedFontBase64 = btoa(binary)
        doc.addFileToVFS('NotoSansDevanagari.ttf', cachedFontBase64)
        doc.addFont('NotoSansDevanagari.ttf', 'Devanagari', 'normal')
        return 'Devanagari'
      }
    }
  } catch (e) {
    console.warn('Could not load Devanagari font dynamically, falling back to helvetica:', e)
  }
  return 'helvetica'
}

function cleanPdfText(text: any, font: string): string {
  if (text === null || text === undefined) return ''
  const str = String(text)
  if (font !== 'helvetica') return str
  // Sanitize non-Latin-1 chars if fallback helvetica is in use
  return str.replace(/[^\x00-\x7F\xA0-\xFF]/g, ' ')
}

export default function PdfDownloadButton({ 
  resident, 
  healthRecords = [], 
  logs = [] 
}: { 
  resident: any
  healthRecords?: any[]
  logs?: any[] 
}) {
  const [isGenerating, setIsGenerating] = useState(false)

  const generatePDF = async () => {
    setIsGenerating(true)
    try {
      const doc = new jsPDF()
      const font = await loadUnicodeFont(doc)
      
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
      doc.setFont(font, 'normal')
      doc.text(`${cleanPdfText(resident?.name || 'Unknown', font)}`, 45, yPos)
      
      doc.setFont('helvetica', 'bold')
      doc.text(`ROOM:`, 130, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(`${resident?.room_number || 'UNASSIGNED'}`, 146, yPos)
      
      yPos += 8
      doc.setFont('helvetica', 'bold')
      doc.text(`AGE:`, 18, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(`${resident?.age ? `${resident.age} YRS` : 'UNKNOWN'}`, 45, yPos)
      
      doc.setFont('helvetica', 'bold')
      doc.text(`BLOOD GRP:`, 130, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(`${resident?.blood_group || 'UNKNOWN'}`, 155, yPos)
      
      yPos += 8
      doc.setFont('helvetica', 'bold')
      doc.text(`EMERGENCY CONTACT:`, 18, yPos)
      doc.setFont(font, 'normal')
      const contactName = cleanPdfText(resident?.family_contact_name || 'N/A', font)
      const contactPhone = cleanPdfText(resident?.family_phone_number || 'N/A', font)
      doc.text(`${contactName} | ${contactPhone}`, 65, yPos)
      
      yPos += 8
      doc.setFont('helvetica', 'bold')
      doc.text(`NOTES/CONDITIONS:`, 18, yPos)
      doc.setFont(font, 'normal')
      
      const conditions: string[] = []
      if (Array.isArray(resident?.critical_conditions)) {
        const valid = resident.critical_conditions.filter((c: any) => c && c !== 'None')
        if (valid.length > 0) conditions.push(valid.join(', '))
      } else if (typeof resident?.critical_conditions === 'string' && resident.critical_conditions !== 'None') {
        conditions.push(resident.critical_conditions)
      }

      if (resident?.mobility_status) conditions.push(`Mobility: ${resident.mobility_status}`)
      if (resident?.communication_barrier) conditions.push(`Communication: ${resident.communication_barrier}`)
      
      const conditionsText = conditions.length > 0 ? conditions.join(' | ') : 'No critical notes.'
      doc.text(doc.splitTextToSize(cleanPdfText(conditionsText, font), 130), 65, yPos)

      yPos += 14 // push past box

      // --- ALERTS BLOCK ---
      const activeAlerts: string[] = []
      if (resident?.life_threatening_allergies && resident.life_threatening_allergies !== 'None') {
          activeAlerts.push(`ALLERGY AVOIDANCE: ${resident.life_threatening_allergies}`)
      }
      if (resident?.wandering_risk) {
          activeAlerts.push('WANDERING RISK ALARM')
      }
      if (resident?.aggression_triggers) {
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
          
          doc.setFont(font, 'normal')
          activeAlerts.forEach(alert => {
              doc.text(`• ${cleanPdfText(alert.toUpperCase(), font)}`, 18, alertY)
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
          headStyles: { fillColor: [30, 64, 175], fontStyle: 'bold', fontSize: 9, halign: 'center' },
          bodyStyles: { fontSize: 10, textColor: [30, 41, 59], halign: 'center', cellPadding: 3 },
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
          cleanPdfText(String(l.status || '').toUpperCase(), font),
          l.meal_taken ? 'ADMINISTERED' : 'REFUSED/SKIP',
          l.medication_taken ? 'ADMINISTERED' : 'REFUSED/SKIP',
          l.mood ? cleanPdfText(String(l.mood).toUpperCase(), font) : 'N/A',
          cleanPdfText(l.notes ? l.notes.substring(0, 60) + (l.notes.length > 60 ? '...' : '') : '-', font)
        ])

        autoTable(doc, {
          startY: yPos,
          head: [['TIMESTAMP', 'STATUS', 'MEAL ADMIN', 'MEDS ADMIN', 'EVAL. MOOD', 'CLINICAL NOTES']],
          body: logsTableData,
          theme: 'grid',
          headStyles: { fillColor: [15, 118, 110], fontStyle: 'bold', fontSize: 9, halign: 'center' },
          bodyStyles: { fontSize: 9, textColor: [30, 41, 59], cellPadding: 3 },
          columnStyles: { 
              0: { halign: 'center', cellWidth: 35 }, 
              1: { halign: 'center', cellWidth: 20 },
              4: { halign: 'center', cellWidth: 25 },
          },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          styles: { font: font === 'Devanagari' ? 'Devanagari' : 'helvetica', lineColor: [203, 213, 225] }
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

      const safeName = (resident?.name || 'Resident')
        .replace(/[^a-zA-Z0-9_\u0900-\u097F]/g, '_')
        .substring(0, 50)
      doc.save(`${safeName}_SevaCare_Official_Report.pdf`)
    } catch (err) {
      console.error('Failed to generate PDF report:', err)
      window.alert('Failed to generate PDF report. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <button 
      type="button"
      disabled={isGenerating}
      onClick={generatePDF}
      className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-white text-blue-600 border-none transition-all w-full h-full disabled:opacity-60 cursor-pointer"
      title="Download Official PDF Medical Report"
    >
      {isGenerating ? (
        <Loader2 className="w-5 h-5 mb-1 animate-spin text-blue-600" />
      ) : (
        <FileDown className="w-5 h-5 mb-1" />
      )}
      <span className="text-xs font-semibold tracking-tight text-slate-500">
        {isGenerating ? 'GENERATING...' : 'PDF REPORT'}
      </span>
    </button>
  )
}
