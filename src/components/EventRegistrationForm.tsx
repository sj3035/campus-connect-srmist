import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EventRegistrationFormProps {
  eventId: string;
}

const EventRegistrationForm: React.FC<EventRegistrationFormProps> = ({ eventId }) => {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    roll_number: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Validate all fields are filled
  const isFormValid =
    form.full_name.trim() &&
    form.email.trim() &&
    form.phone.trim() &&
    form.roll_number.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);

    const { error } = await supabase.from("registrations").insert({
      ...form,
      event_id: eventId,
      // other fields may be added here, set status to "pending" by default
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to register for the event",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Registration submitted successfully!",
      });
      setForm({
        full_name: "",
        email: "",
        phone: "",
        roll_number: "",
      });
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <Label htmlFor="full_name">Full Name</Label>
        <Input
          id="full_name"
          name="full_name"
          value={form.full_name}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="roll_number">Roll Number</Label>
        <Input
          id="roll_number"
          name="roll_number"
          value={form.roll_number}
          onChange={handleChange}
          required
        />
      </div>
      <Button type="submit" disabled={loading || !isFormValid}>
        {loading ? "Submitting..." : "Register"}
      </Button>
    </form>
  );
};

export default EventRegistrationForm;
