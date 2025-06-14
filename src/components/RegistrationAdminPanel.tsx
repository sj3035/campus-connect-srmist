
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

type Registration = {
  id: string;
  event_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  roll_number: string;
  status: "approved" | "rejected" | "pending" | "waitlisted" | null;
};

interface RegistrationAdminPanelProps {
  eventId?: string;
}

const RegistrationAdminPanel: React.FC<RegistrationAdminPanelProps> = ({
  eventId,
}) => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    if (isAdmin()) {
      fetchRegistrations();
    }
    // eslint-disable-next-line
  }, [eventId, user]);

  const fetchRegistrations = async () => {
    setLoading(true);

    // Find events organized by this user if eventId is not provided, else fetch for the provided eventId
    let eventQuery = supabase.from("events").select("id");

    if (eventId) {
      eventQuery = eventQuery.eq("id", eventId);
    } else {
      if (!user) return;
      eventQuery = eventQuery.eq("organizer_id", user.id);
    }

    const { data: eventData, error: eventError } = await eventQuery;
    if (eventError) {
      toast({
        title: "Error",
        description: "Failed to fetch events",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const eventIds = eventData?.map((e) => e.id);
    if (!eventIds || eventIds.length === 0) {
      setRegistrations([]);
      setLoading(false);
      return;
    }

    // Fetch registrations for those events
    const { data, error } = await supabase
      .from("registrations")
      .select("*")
      .in("event_id", eventIds);

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

  const updateStatus = async (
    id: string,
    status: "approved" | "rejected" | "pending" | "waitlisted"
  ) => {
    const { error } = await supabase
      .from("registrations")
      .update({
        status,
        approved_at: status === "approved" ? new Date().toISOString() : null,
      })
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
      fetchRegistrations();
    }
  };

  if (!isAdmin()) return <div>You do not have access to manage participants.</div>;

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
              <span
                className={
                  reg.status === "approved"
                    ? "text-green-600"
                    : reg.status === "rejected"
                    ? "text-red-600"
                    : "text-gray-500"
                }
              >
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

