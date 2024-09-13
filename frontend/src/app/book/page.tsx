"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, ClockIcon, UsersIcon, UtensilsIcon, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export default function MobileFriendlyCustomerBooking() {
    const [availableTables, setAvailableTables] = useState([
        { id: 1, capacity: 2 },
        { id: 2, capacity: 4 },
        { id: 3, capacity: 6 },
    ])

    const [isLoading, setIsLoading] = useState(false)
    const [bookingComplete, setBookingComplete] = useState(false)
    const [date, setDate] = useState<Date>()

    // Available time slots
    const availableTimes = [
        "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"
    ]

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        const formData = new FormData(e.currentTarget)
        const bookingData = Object.fromEntries(formData)
        console.log("Booking submitted:", bookingData)
        setTimeout(() => {
            setIsLoading(false)
            setBookingComplete(true)
        }, 2000)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center p-4">
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
                                <Input id="name" name="name" required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                                <Input id="email" name="email" type="email" required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date" className="text-sm font-medium text-gray-700">Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={`w-full justify-start text-left font-normal ${!date && "text-muted-foreground"}`}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date ? format(date, "PPP") : "Pick a date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="time" className="text-sm font-medium text-gray-700">Time</Label>
                                <div className="relative">
                                    <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <Select name="time" required>
                                        <SelectTrigger className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500">
                                            <SelectValue placeholder="Select a time" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableTimes.map(time => (
                                                <SelectItem key={time} value={time}>{time}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="guests" className="text-sm font-medium text-gray-700">Number of Guests</Label>
                                <div className="relative">
                                    <UsersIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <Select name="guests" required>
                                        <SelectTrigger className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500">
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
                                <Label htmlFor="table" className="text-sm font-medium text-gray-700">Table</Label>
                                <div className="relative">
                                    <UtensilsIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <Select name="table" required>
                                        <SelectTrigger className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500">
                                            <SelectValue placeholder="Select a table" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableTables.map(table => (
                                                <SelectItem key={table.id} value={table.id.toString()}>
                                                    Table {table.id} (Capacity: {table.capacity})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-md transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500" disabled={isLoading}>
                                {isLoading ? (
                                    <motion.div
                                        className="h-5 w-5 rounded-full border-t-2 border-r-2 border-white"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    />
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
                        <Button onClick={() => setBookingComplete(false)} className="bg-teal-600 hover:bg-teal-700 text-white">
                            Make Another Reservation
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}