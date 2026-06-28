import React, { createContext, useContext, useState } from 'react'
import { Hospital, FamilyMember } from '../../types'
import { Doctor } from '../../types'

interface PatientInfo {
  name: string
  age: string
  gender: string
  phone: string
  reason: string
  isSelf: boolean
  familyMemberId?: string
}

interface BookingState {
  hospital: Hospital | null
  doctor: Doctor | null
  selectedDate: string | null
  selectedSlotId: string | null
  selectedSlotTime: string | null
  patientInfo: PatientInfo | null
  paymentMethod: string
}

interface BookingContextType {
  booking: BookingState
  setHospital: (h: Hospital) => void
  setDoctor: (d: Doctor) => void
  setDateSlot: (date: string, slotId: string, slotTime: string) => void
  setPatientInfo: (info: PatientInfo) => void
  setPaymentMethod: (method: string) => void
  resetBooking: () => void
}

const defaultState: BookingState = {
  hospital: null,
  doctor: null,
  selectedDate: null,
  selectedSlotId: null,
  selectedSlotTime: null,
  patientInfo: null,
  paymentMethod: 'upi',
}

const BookingContext = createContext<BookingContextType>({
  booking: defaultState,
  setHospital: () => {},
  setDoctor: () => {},
  setDateSlot: () => {},
  setPatientInfo: () => {},
  setPaymentMethod: () => {},
  resetBooking: () => {},
})

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [booking, setBooking] = useState<BookingState>(defaultState)

  const setHospital = (hospital: Hospital) =>
    setBooking(prev => ({ ...prev, hospital, doctor: null, selectedDate: null, selectedSlotId: null }))

  const setDoctor = (doctor: Doctor) =>
    setBooking(prev => ({ ...prev, doctor, selectedDate: null, selectedSlotId: null }))

  const setDateSlot = (date: string, slotId: string, slotTime: string) =>
    setBooking(prev => ({ ...prev, selectedDate: date, selectedSlotId: slotId, selectedSlotTime: slotTime }))

  const setPatientInfo = (patientInfo: PatientInfo) =>
    setBooking(prev => ({ ...prev, patientInfo }))

  const setPaymentMethod = (paymentMethod: string) =>
    setBooking(prev => ({ ...prev, paymentMethod }))

  const resetBooking = () => setBooking(defaultState)

  return (
    <BookingContext.Provider value={{
      booking, setHospital, setDoctor, setDateSlot, setPatientInfo, setPaymentMethod, resetBooking
    }}>
      {children}
    </BookingContext.Provider>
  )
}

export const useBooking = () => useContext(BookingContext)
