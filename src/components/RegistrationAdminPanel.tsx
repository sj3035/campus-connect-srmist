
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

type Registration = {
  id: string;
  event_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  roll_number: string;
  status: string | null;
};

interface RegistrationAdminPanelProps {
  eventId: string;
}

const RegistrationAdminPanel: React.FC<RegistrationAdminPanelProps> = ({ eventId }) => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegistrations();
    // eslint-disable-next-line
  }, [eventId]);

  const fetchRegistrations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("registrations")
      .select("*")
      .eq("event_id", eventId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch registrations",
        variant: "destructive",
      });
    } else {
      setRegistrations(data || []);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("registrations")
      .update({ status, approved_at: status === "approved" ? new Date().toISOString() : null })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Marked as ${status}`,
      });
      // Placeholder for notification logic:
      // await sendEmailOrSmsNotification(email, status) - not implemented here.
      fetchRegistrations();
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!registrations.length) return <div>No registrations yet.</div>;

  return (
    <div className="grid gap-4">
      {registrations.map((reg) => (
        <Card key={reg.id}>
          <CardContent className="p-4 space-y-2">
            <div>
              <span className="font-bold">Name:</span> {reg.full_name}
            </div>
            <div>
              <span className="font-bold">Email:</span> {reg.email}
            </div>
            <div>
              <span className="font-bold">Phone:</span> {reg.phone}
            </div>
            <div>
              <span className="font-bold">Roll Number:</span> {reg.roll_number}
            </div>
            <div>
              <span className="font-bold">Status:</span>{" "}
              <span className={
                reg.status === "approved" ? "text-green-600" :
                reg.status === "rejected" ? "text-red-600" : "text-gray-500"
              }>
                {reg.status}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => updateStatus(reg.id, "approved")}
                disabled={reg.status === "approved"}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => updateStatus(reg.id, "rejected")}
                disabled={reg.status === "rejected"}
              >
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default RegistrationAdminPanel;
