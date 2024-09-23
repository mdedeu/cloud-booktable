"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusIcon, CheckIcon, XIcon, AlertCircle, CalendarIcon, Loader2 } from "lucide-react"
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { format} from 'date-fns'
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { tableService } from "@/lib/table_service"
import { reservationService } from "@/lib/reservation_service"

interface TableAvailability {
    date: string;
    times: {
        [key: string]: boolean;
    };
}

interface Table {
    id: number;
    capacity: number;
    availability: TableAvailability[];
}

interface Reservation {
    id: number;
    name: string;
    date: string;
    time: string;
    guests: number;
    tableId: number;
}

const timeSlots = [
    "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM"
]

export default function IntegratedRestaurantDashboard() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [tables, setTables] = useState<Table[]>([])
    const [reservations, setReservations] = useState<Reservation[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchTables()
        fetchReservations()
    }, [])

    const fetchTables = async () => {
        try {
            const fetchedTables = await tableService.getTables()
            setTables(fetchedTables)
        } catch (error) {
            toast.error("Failed to fetch tables")
        } finally {
            setIsLoading(false)
        }
    }

    const fetchReservations = async () => {
        try {
            const fetchedReservations = await reservationService.getReservations()
            setReservations(fetchedReservations)
        } catch (error) {
            toast.error("Failed to fetch reservations")
        }
    }

    const handleAddTable = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const capacity = Number(formData.get("capacity"))
        const newTable: Partial<Table> = {
            capacity,
            availability: [
                {
                    date: format(selectedDate, 'yyyy-MM-dd'),
                    times: timeSlots.reduce((acc, slot) => ({ ...acc, [slot]: true }), {})
                }
            ]
        }
        try {
            const createdTable = await tableService.createTable(newTable)
            setTables([...tables, createdTable])
            toast.success("New table added successfully!")
        } catch (error) {
            console.log(error)
            toast.error("Failed to add new table")
        }
    }

    const handleToggleTableAvailability = async (id: number, timeSlot: string) => {
        const dateString = format(selectedDate, 'yyyy-MM-dd')
        const table = tables.find(t => t.id === id)
        if (!table) return

        const availabilityIndex = table.availability.findIndex(a => a.date === dateString)
        let updatedAvailability: TableAvailability[]

        if (availabilityIndex !== -1) {
            updatedAvailability = [...table.availability]
            updatedAvailability[availabilityIndex] = {
                ...updatedAvailability[availabilityIndex],
                times: {
                    ...updatedAvailability[availabilityIndex].times,
                    [timeSlot]: !updatedAvailability[availabilityIndex].times[timeSlot]
                }
            }
        } else {
            updatedAvailability = [
                ...table.availability,
                {
                    date: dateString,
                    times: {
                        ...timeSlots.reduce((acc, slot) => ({ ...acc, [slot]: true }), {}),
                        [timeSlot]: false
                    }
                }
            ]
        }

        try {
            await tableService.updateTable(id, { ...table, availability: updatedAvailability })
            setTables(tables.map(t => t.id === id ? { ...t, availability: updatedAvailability } : t))
            toast.info(`Table ${id} on ${format(selectedDate, 'MMM dd, yyyy')} at ${timeSlot} is now ${updatedAvailability[availabilityIndex]?.times[timeSlot] ? 'available' : 'unavailable'}`)
        } catch (error) {
            toast.error("Failed to update table availability")
        }
    }

    const getTableAvailability = (table: Table, date: Date, timeSlot: string): boolean => {
        if (!table.availability || table.availability.length === 0) {
            return false // Assume available if no data
        }
        const dateString = format(date, 'yyyy-MM-dd')
        const availabilityForDate = table.availability.find(a => a.date === dateString)
        return availabilityForDate?.times[timeSlot] ?? false // Assume available if no data for the date
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-teal-600 to-emerald-700">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
        )
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
                                                variant="outline"
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
                                                                    getTableAvailability(table, selectedDate, slot)
                                                                        ? "bg-green-100 hover:bg-green-200 text-green-800"
                                                                        : "bg-red-100 hover:bg-red-200 text-red-800"
                                                                }`}
                                                            >
                                                                {getTableAvailability(table, selectedDate, slot) ? <CheckIcon className="h-4 w-4" /> : <XIcon className="h-4 w-4" />}
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
                                        <p className="text-teal-600">When customers make reservations, they&apos;ll appear here.</p>
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