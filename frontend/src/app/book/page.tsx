"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, ClockIcon, UsersIcon, CheckCircle, Loader2 } from "lucide-react"
import { format, isSameDay, startOfDay } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { tableService } from "@/lib/table_service"
import { reservationService } from "@/lib/reservation_service"
import { Table } from "@/lib/types"

export default function IntegratedCustomerBooking() {
    const [tables, setTables] = useState<Table[]>([])
    const [filteredTables, setFilteredTables] = useState<Table[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [bookingComplete, setBookingComplete] = useState(false)
    const [date, setDate] = useState<Date | undefined>(undefined)
    const [availableDates, setAvailableDates] = useState<Date[]>([])
    const [availableTimes, setAvailableTimes] = useState<string[]>([])
    const [selectedTable, setSelectedTable] = useState<number | null>(null)
    const [guests, setGuests] = useState<number | null>(null)
    const [selectedTime, setSelectedTime] = useState<string | null>(null)

    useEffect(() => {
        fetchTables()
    }, [])

    useEffect(() => {
        if (guests) {
            const filtered = tables.filter(table => table.capacity >= guests)
            setFilteredTables(filtered)
            const dates = getAvailableDates(filtered)
            setAvailableDates(dates)
            setDate(undefined)
            setAvailableTimes([])
            setSelectedTable(null)
            setSelectedTime(null)
        } else {
            setFilteredTables([])
            setAvailableDates([])
            setDate(undefined)
            setAvailableTimes([])
            setSelectedTable(null)
            setSelectedTime(null)
        }
    }, [guests, tables])

    const fetchTables = async () => {
        setIsLoading(true)
        try {
            const fetchedTables = await tableService.getTables()
            if (Array.isArray(fetchedTables)) {
                setTables(fetchedTables)
            } else {
                throw new Error("Invalid data format received from API")
            }
        } catch (error) {
            console.error("Error fetching tables:", error)
            toast.error("Failed to fetch tables. Please try again later.")
        } finally {
            setIsLoading(false)
        }
    }

    const getAvailableDates = (tables: Table[]): Date[] => {
        const dates = new Set<string>()
        tables.forEach(table => {
            if (Array.isArray(table.availability)) {
                table.availability.forEach(slot => {
                    if (slot.date && Object.values(slot.times).some(available => available)) {
                        dates.add(slot.date)
                    }
                })
            }
        })
        return Array.from(dates)
            .filter((dateString) => dateString != null)
            .map(dateString => startOfDay(new Date(dateString)))
            .filter(date => date >= startOfDay(new Date())) // Only future dates
    }

    const handleDateChange = (newDate: Date | undefined) => {
        setDate(newDate)
        setSelectedTable(null)
        setSelectedTime(null)
        if (newDate) {
            const formattedDate = format(newDate, 'yyyy-MM-dd')
            const times = new Set<string>()
            filteredTables.forEach(table => {
                const dateSlot = table.availability.find(slot => slot.date && isSameDay(new Date(slot.date), newDate))
                if (dateSlot) {
                    Object.entries(dateSlot.times).forEach(([time, available]) => {
                        if (available) times.add(time)
                    })
                }
            })
            setAvailableTimes(Array.from(times).sort())
        } else {
            setAvailableTimes([])
        }
    }

    const handleTimeChange = (time: string) => {
        setSelectedTime(time)
        if (date) {
            const availableTablesForDateTime = filteredTables.filter(table =>
                table.availability.some(slot =>
                    slot.date && isSameDay(new Date(slot.date), date) && slot.times[time]
                )
            )
            if (availableTablesForDateTime.length > 0) {
                setSelectedTable(availableTablesForDateTime[0].id)
            } else {
                setSelectedTable(null)
            }
        }
    }

    const handleGuestsChange = (value: string) => {
        setGuests(parseInt(value, 10))
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!selectedTable || !date || !selectedTime || !guests) {
            toast.error("Please fill in all required fields")
            return
        }
        setIsLoading(true)
        const formData = new FormData(e.currentTarget)
        const reservationData = {
            table_id: selectedTable,
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            date: format(date, 'yyyy-MM-dd'),
            time_slot: selectedTime,
            guests: guests
        }

        try {
            await reservationService.createReservation(reservationData)
            setBookingComplete(true)
            toast.success("Reservation created successfully!")
        } catch (error) {
            console.error("Error creating reservation:", error)
            toast.error("Failed to create reservation. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center p-4">
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
            <AnimatePresence>
                {!bookingComplete ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                        className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden"
                    >
                        <div className="p-6 bg-teal-700 text-white">
                            <h1 className="text-2xl md:text-3xl font-bold mb-2">Book Your Table</h1>
                            <p className="text-teal-100 text-sm md:text-base">Experience culinary excellence at La Belle Époque</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 p-4 md:p-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-medium text-gray-700">Name</Label>
                                <Input id="name" name="name" required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-muted-foreground" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                                <Input id="email" name="email" type="email" required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-muted-foreground" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="guests" className="text-sm font-medium text-gray-700">Number of Guests</Label>
                                <div className="relative">
                                    <UsersIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <Select name="guests" required onValueChange={handleGuestsChange}>
                                        <SelectTrigger className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-muted-foreground">
                                            <SelectValue placeholder="Select number of guests" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[1, 2, 3, 4, 5, 6].map(num => (
                                                <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date" className="text-sm font-medium text-gray-700">Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={`w-full justify-start text-left font-normal text-gray-700`}
                                            disabled={!guests || availableDates.length === 0}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date ? format(date, "PPP") : "Pick a date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 text-gray-700" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={handleDateChange}
                                            disabled={(date) =>
                                                !availableDates.some(availableDate =>
                                                    isSameDay(availableDate, date)
                                                )
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="time" className="text-sm font-medium text-gray-700">Time</Label>
                                <div className="relative">
                                    <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <Select name="time" required onValueChange={handleTimeChange} disabled={!date || availableTimes.length === 0}>
                                        <SelectTrigger className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-muted-foreground`}>
                                            <SelectValue placeholder="Select a time"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableTimes.map(time => (
                                                <SelectItem key={time} value={time}>{time}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-md transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500" disabled={isLoading || !selectedTable}>
                                {isLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    "Confirm Reservation"
                                )}
                            </Button>
                        </form>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden text-center p-6 md:p-8"
                    >
                        <CheckCircle className="w-12 h-12 md:w-16 md:h-16 text-teal-600 mx-auto mb-4" />
                        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">Booking Confirmed!</h2>
                        <p className="text-gray-600 mb-4 text-sm md:text-base">Thank you for choosing La Belle Époque. We look forward to serving you.</p>
                        <Button onClick={() => {
                            setBookingComplete(false)
                            setDate(undefined)
                            setSelectedTable(null)
                            setAvailableTimes([])
                            setGuests(null)
                            setSelectedTime(null)
                        }} className="bg-teal-600 hover:bg-teal-700 text-white">
                            Make Another Reservation
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}