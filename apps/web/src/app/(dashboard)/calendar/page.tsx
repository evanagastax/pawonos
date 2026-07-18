"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Meal Calendar</h2>
          <p className="text-muted-foreground">Schedule meals for production</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" />Schedule Meal</Button>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
            <CardTitle>July 2026</CardTitle>
            <Button variant="outline" size="icon"><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 text-center">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="p-2 text-sm font-medium text-muted-foreground">{day}</div>
            ))}
            {Array.from({ length: 31 }, (_, i) => i + 1).map(date => (
              <div key={date} className="p-2 border rounded-lg hover:bg-accent cursor-pointer min-h-[80px]">
                <div className="text-sm font-medium">{date}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}