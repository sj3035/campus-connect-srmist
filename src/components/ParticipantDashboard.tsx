
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Search, Filter, FileText, FileSpreadsheet, Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Tables } from '@/integrations/supabase/types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

type Event = Tables<'events'>;

interface ParticipantData {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  roll_number: string;
  status: 'pending' | 'approved' | 'rejected';
  registration_date: string;
  approved_at?: string;
  approved_by?: string;
}

interface ParticipantDashboardProps {
  event: Event;
  participants: ParticipantData[];
  onUpdateStatus: (registrationId: string, status: 'approved' | 'rejected') => void;
}

const ParticipantDashboard: React.FC<ParticipantDashboardProps> = ({
  event,
  participants,
  onUpdateStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filter participants based on search and status
  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = 
      participant.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.roll_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || participant.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get status counts
  const statusCounts = {
    total: participants.length,
    approved: participants.filter(p => p.status === 'approved').length,
    pending: participants.filter(p => p.status === 'pending').length,
    rejected: participants.filter(p => p.status === 'rejected').length,
  };

  // Download as CSV
  const downloadCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Roll Number', 'Status', 'Registration Date', 'Approved Date'];
    const csvContent = [
      headers.join(','),
      ...filteredParticipants.map(participant => [
        `"${participant.full_name}"`,
        `"${participant.email}"`,
        `"${participant.phone || 'N/A'}"`,
        `"${participant.roll_number}"`,
        `"${participant.status}"`,
        `"${format(parseISO(participant.registration_date), 'PPP')}"`,
        `"${participant.approved_at ? format(parseISO(participant.approved_at), 'PPP') : 'N/A'}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${event.title.replace(/\s+/g, '_')}_participants.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download as PDF
  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text(`${event.title} - Participant Report`, 20, 20);
    
    // Add event details
    doc.setFontSize(12);
    doc.text(`Event Date: ${format(parseISO(event.event_date), 'PPP')}`, 20, 35);
    doc.text(`Venue: ${event.venue}`, 20, 45);
    doc.text(`Total Participants: ${statusCounts.total} | Approved: ${statusCounts.approved} | Pending: ${statusCounts.pending}`, 20, 55);
    
    // Add table
    const tableData = filteredParticipants.map(participant => [
      participant.full_name,
      participant.email,
      participant.phone || 'N/A',
      participant.roll_number,
      participant.status.toUpperCase(),
      format(parseISO(participant.registration_date), 'MMM d, yyyy'),
    ]);

    (doc as any).autoTable({
      head: [['Name', 'Email', 'Phone', 'Roll Number', 'Status', 'Registration Date']],
      body: tableData,
      startY: 65,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save(`${event.title.replace(/\s+/g, '_')}_participants.pdf`);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {event.title} - Participant Dashboard
            </CardTitle>
            <div className="flex gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  Total: {statusCounts.total}
                </Badge>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Approved: {statusCounts.approved}
                </Badge>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                  Pending: {statusCounts.pending}
                </Badge>
                {statusCounts.rejected > 0 && (
                  <Badge variant="outline" className="bg-red-50 text-red-700">
                    Rejected: {statusCounts.rejected}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadCSV}
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadPDF}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search participants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Participants Table */}
        {filteredParticipants.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Roll Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParticipants.map((participant) => (
                  <TableRow key={participant.id}>
                    <TableCell className="font-medium">
                      {participant.full_name}
                    </TableCell>
                    <TableCell>{participant.email}</TableCell>
                    <TableCell>{participant.phone || 'N/A'}</TableCell>
                    <TableCell>{participant.roll_number}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          participant.status === 'approved'
                            ? 'bg-green-500 text-white'
                            : participant.status === 'pending'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-red-500 text-white'
                        }
                      >
                        {participant.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {participant.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                        {participant.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                        {participant.status.charAt(0).toUpperCase() + participant.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(parseISO(participant.registration_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {participant.status === 'pending' && (
                        <div className="flex justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                            onClick={() => onUpdateStatus(participant.id, 'approved')}
                            title="Approve"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                            onClick={() => onUpdateStatus(participant.id, 'rejected')}
                            title="Reject"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {participant.status !== 'pending' && (
                        <div className="flex justify-center">
                          <Badge variant="outline">
                            {participant.status === 'approved' ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : (
                              <XCircle className="h-3 w-3 text-red-500" />
                            )}
                          </Badge>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No participants found</p>
            <p className="text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Participants will appear here once they register for your event.'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ParticipantDashboard;
