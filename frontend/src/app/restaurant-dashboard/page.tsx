"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardIcon, PlusIcon, CheckIcon, XIcon, AlertCircle, CalendarIcon } from "lucide-react"
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { format, addDays } from 'date-fns'
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Define the time slots
const timeSlots = [
    "18:00", "19:00", "20:00", "21:00", "22:00"
]

type TableAvailability = {
    [key: string]: {
        [key: string]: boolean
    }
}

type Table = {
    id: number
    capacity: number
    availability: TableAvailability
}

export default function ImprovedDateAwareMobileFriendlyRestaurantDashboard() {
    const [bookingLink, setBookingLink] = useState("https://labelle-epoque.com/book")
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [tables, setTables] = useState<Table[]>([
        {
            id: 1,
            capacity: 2,
            availability: {
                [format(new Date(), 'yyyy-MM-dd')]: { "18:00": true, "19:00": true, "20:00": true, "21:00": true, "22:00": true },
                [format(addDays(new Date(), 1), 'yyyy-MM-dd')]: { "18:00": true, "19:00": true, "20:00": true, "21:00": true, "22:00": true },
            }
        },
        {
            id: 2,
            capacity: 4,
            availability: {
                [format(new Date(), 'yyyy-MM-dd')]: { "18:00": true, "19:00": false, "20:00": true, "21:00": true, "22:00": true },
                [format(addDays(new Date(), 1), 'yyyy-MM-dd')]: { "18:00": true, "19:00": true, "20:00": true, "21:00": true, "22:00": true },
            }
        },
        {
            id: 3,
            capacity: 6,
            availability: {
                [format(new Date(), 'yyyy-MM-dd')]: { "18:00": true, "19:00": true, "20:00": false, "21:00": false, "22:00": true },
                [format(addDays(new Date(), 1), 'yyyy-MM-dd')]: { "18:00": true, "19:00": true, "20:00": true, "21:00": true, "22:00": true },
            }
        },
    ])
    const [reservations, setReservations] = useState([
        { id: 1, name: "John Doe", date: "2023-06-15", time: "19:00", guests: 2, tableId: 1 },
        { id: 2, name: "Jane Smith", date: "2023-06-16", time: "20:00", guests: 4, tableId: 2 },
    ])

    const handleAddTable = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const capacity = Number(formData.get("capacity"))
        const newTable: Table = {
            id: tables.length + 1,
            capacity,
            availability: {
                [format(selectedDate, 'yyyy-MM-dd')]: timeSlots.reduce((acc, slot) => ({ ...acc, [slot]: true }), {})
            }
        }
        setTables([...tables, newTable])
        e.currentTarget.reset()
        toast.success("New table added successfully!")
    }

    const handleToggleTableAvailability = (id: number, timeSlot: string) => {
        const dateString = format(selectedDate, 'yyyy-MM-dd')
        setTables(tables.map(table =>
            table.id === id
                ? {
                    ...table,
                    availability: {
                        ...table.availability,
                        [dateString]: {
                            ...table.availability[dateString],
                            [timeSlot]: !table.availability[dateString]?.[timeSlot]
                        }
                    }
                }
                : table
        ))
        const table = tables.find(t => t.id === id)
        if (table) {
            toast.info(`Table ${id} on ${format(selectedDate, 'MMM dd, yyyy')} at ${timeSlot} is now ${table.availability[dateString]?.[timeSlot] ? 'unavailable' : 'available'}`)
        }
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(bookingLink)
        toast.success("Booking link copied to clipboard!")
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-600 to-emerald-700 p-4 md:p-8">
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-2xl md:text-4xl font-bold mb-4 md:mb-8 text-white">La Belle Époque Dashboard</h1>

                <Card className="mb-4 md:mb-8 bg-white disabled">
                    <CardHeader>
                        <CardTitle className="text-teal-800 text-lg md:text-xl">Booking Link</CardTitle>
                        <CardDescription className="text-teal-600 text-sm">Share this link with your customers</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-2">
                            <div className="w-full md:flex-1 relative">
                                <Input value={bookingLink} readOnly className="bg-gray-100 text-teal-800 border-teal-300 pr-20" />
                                <Button onClick={copyToClipboard} variant="secondary" className="absolute right-0 top-0 bottom-0 bg-teal-600 hover:bg-teal-700 text-white">
                                    <ClipboardIcon className="h-4 w-4" />
                                    <span className="sr-only">Copy</span>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Tabs defaultValue="tables" className="space-y-4">
                    <TabsList className="bg-white w-full">
                        <TabsTrigger value="tables" className="flex-1 data-[state=active]:bg-teal-600 data-[state=active]:text-white">Tables</TabsTrigger>
                        <TabsTrigger value="reservations" className="flex-1 data-[state=active]:bg-teal-600 data-[state=active]:text-white">Reservations</TabsTrigger>
                    </TabsList>

                    <TabsContent value="tables" className="space-y-4">
                        <Card className="bg-white">
                            <CardHeader>
                                <CardTitle className="text-teal-800 text-lg md:text-xl">Add New Table</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleAddTable} className="flex flex-col md:flex-row items-end space-y-2 md:space-y-0 md:space-x-2">
                                    <div className="flex-grow w-full md:w-auto">
                                        <Label htmlFor="capacity" className="text-sm text-teal-700">Capacity</Label>
                                        <Input id="capacity" name="capacity" type="number" placeholder="Enter capacity" min="1" required className="bg-gray-100 text-teal-800 border-teal-300" />
                                    </div>
                                    <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white w-full md:w-auto">
                                        <PlusIcon className="mr-2 h-4 w-4" />
                                        Add Table
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        <Card className="bg-white">
                            <CardHeader>
                                <CardTitle className="text-teal-800 text-lg md:text-xl">Table Management</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-4 space-y-2">
                                    <Label htmlFor="date" className="text-sm font-medium text-gray-700">Select Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                id="date"
                                                variant={"outline"}
                                                className={`w-full md:w-auto justify-start text-left font-normal`}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {format(selectedDate, 'PPP')}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={selectedDate}
                                                onSelect={(date) => date && setSelectedDate(date)}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-teal-700">ID</TableHead>
                                                <TableHead className="text-teal-700">Capacity</TableHead>
                                                {timeSlots.map(slot => (
                                                    <TableHead key={slot} className="text-teal-700">{slot}</TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {tables.map(table => (
                                                <TableRow key={table.id}>
                                                    <TableCell className="font-medium text-teal-800">{table.id}</TableCell>
                                                    <TableCell className="text-teal-800">{table.capacity}</TableCell>
                                                    {timeSlots.map(slot => (
                                                        <TableCell key={slot}>
                                                            <Button
                                                                onClick={() => handleToggleTableAvailability(table.id, slot)}
                                                                variant="outline"
                                                                size="sm"
                                                                className={`${
                                                                    table.availability[format(selectedDate, 'yyyy-MM-dd')]?.[slot]
                                                                        ? "bg-green-100 hover:bg-green-200 text-green-800"
                                                                        : "bg-red-100 hover:bg-red-200 text-red-800"
                                                                }`}
                                                            >
                                                                {table.availability[format(selectedDate, 'yyyy-MM-dd')]?.[slot] ? <CheckIcon className="h-4 w-4" /> : <XIcon className="h-4 w-4" />}
                                                            </Button>
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="reservations">
                        <Card className="bg-white overflow-x-auto">
                            <CardHeader>
                                <CardTitle className="text-teal-800 text-lg md:text-xl">Current Reservations</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {reservations.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-teal-700">ID</TableHead>
                                                <TableHead className="text-teal-700">Name</TableHead>
                                                <TableHead className="text-teal-700">Date</TableHead>
                                                <TableHead className="text-teal-700">Time</TableHead>
                                                <TableHead className="text-teal-700">Guests</TableHead>
                                                <TableHead className="text-teal-700">Table</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {reservations.map(reservation => (
                                                <TableRow key={reservation.id}>
                                                    <TableCell className="font-medium text-teal-800">{reservation.id}</TableCell>
                                                    <TableCell className="text-teal-800">{reservation.name}</TableCell>
                                                    <TableCell className="text-teal-800">{reservation.date}</TableCell>
                                                    <TableCell className="text-teal-800">{reservation.time}</TableCell>
                                                    <TableCell className="text-teal-800">{reservation.guests}</TableCell>
                                                    <TableCell className="text-teal-800">{reservation.tableId}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="text-center py-8">
                                        <AlertCircle className="mx-auto h-12 w-12 text-teal-600 mb-4" />
                                        <h3 className="text-lg font-semibold mb-2 text-teal-800">No Reservations Yet</h3>
                                        <p className="text-teal-600">When customers make reservations, they'll appear here.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </motion.div>
        </div>
    )
}