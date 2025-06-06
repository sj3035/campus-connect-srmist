
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useMutation } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from '@/components/ui/select';
import { 
  CheckCircle2,
  ArrowRight, 
  ArrowLeft, 
  CalendarIcon, 
  Clock, 
  Upload, 
  Image, 
  Info, 
  Map
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

const eventCategories = [
  'Technical',
  'Cultural',
  'Sports',
  'Academic',
  'Workshop',
  'Conference',
  'Competition',
  'Other'
];

type EventFormData = {
  title: string;
  description: string;
  category: string;
  venue: string;
  max_participants?: number;
  event_date: Date;
  registration_deadline: Date;
  requirements?: string;
  tags?: string[];
  image?: File | null;
};

const STEPS = [
  { id: 'basic', title: 'Basic Info' },
  { id: 'details', title: 'Event Details' },
  { id: 'requirements', title: 'Requirements' },
  { id: 'media', title: 'Media' },
  { id: 'review', title: 'Review' },
];

const CreateEventPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    category: '',
    venue: '',
    event_date: new Date(),
    registration_deadline: new Date(),
    tags: [],
  });
  
  // Update form data
  const updateFormData = (field: keyof EventFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Add tag to the list
  const addTag = () => {
    if (tagInput.trim() && (!formData.tags || !formData.tags.includes(tagInput.trim()))) {
      updateFormData('tags', [...(formData.tags || []), tagInput.trim()]);
      setTagInput('');
    }
  };

  // Remove tag from the list
  const removeTag = (tag: string) => {
    updateFormData('tags', (formData.tags || []).filter(t => t !== tag));
  };

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      updateFormData('image', e.target.files[0]);
    }
  };

  // Create event mutation
  const createEvent = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      setIsSubmitting(true);

      try {
        let imageUrl = null;
        
        // Upload image if provided
        if (formData.image) {
          const fileExt = formData.image.name.split('.').pop();
          const fileName = `${uuidv4()}.${fileExt}`;
          const filePath = `events/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(filePath, formData.image);
            
          if (uploadError) throw uploadError;
          
          const { data } = supabase.storage.from('images').getPublicUrl(filePath);
          imageUrl = data.publicUrl;
        }
        
        // Create event
        const { data, error } = await supabase
          .from('events')
          .insert({
            title: formData.title,
            description: formData.description,
            category: formData.category,
            venue: formData.venue,
            max_participants: formData.max_participants,
            event_date: formData.event_date.toISOString(),
            registration_deadline: formData.registration_deadline.toISOString(),
            requirements: formData.requirements,
            tags: formData.tags,
            image_url: imageUrl,
            organizer_id: user.id,
            status: 'pending',
          })
          .select()
          .single();
          
        if (error) throw error;
        return data;
      } finally {
        setIsSubmitting(false);
      }
    },
    onSuccess: () => {
      toast({
        title: "Event created successfully",
        description: "Your event has been submitted for approval.",
      });
      navigate('/dashboard');
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create event",
        description: error.message || "An error occurred while creating the event.",
        variant: "destructive",
      });
    },
  });
  
  // Form validation
  const validateCurrentStep = () => {
    try {
      switch(step) {
        case 0: // Basic Info
          if (!formData.title || formData.title.length < 5) {
            throw new Error('Title must be at least 5 characters');
          }
          if (!formData.description || formData.description.length < 20) {
            throw new Error('Description must be at least 20 characters');
          }
          if (!formData.category) {
            throw new Error('Please select a category');
          }
          break;
          
        case 1: // Event Details
          if (!formData.venue) {
            throw new Error('Venue is required');
          }
          if (!formData.event_date) {
            throw new Error('Event date is required');
          }
          if (!formData.registration_deadline) {
            throw new Error('Registration deadline is required');
          }
          if (formData.registration_deadline > formData.event_date) {
            throw new Error('Registration deadline must be before the event date');
          }
          break;
          
        // No strict validation for steps 2 & 3
      }
      return true;
    } catch (error: any) {
      toast({
        title: "Validation Error",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };
  
  // Navigate to the next step
  const nextStep = () => {
    if (validateCurrentStep()) {
      if (step < STEPS.length - 1) {
        setStep(step + 1);
      } else {
        createEvent.mutate();
      }
    }
  };
  
  // Navigate to the previous step
  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  // Render the appropriate form step
  const renderFormStep = () => {
    switch(step) {
      case 0: // Basic Info
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title*</Label>
              <Input
                id="title"
                placeholder="Give your event a clear and catchy title"
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description*</Label>
              <Textarea
                id="description"
                placeholder="Provide a detailed description of your event"
                className="min-h-[150px]"
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category*</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => updateFormData('category', value)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {eventCategories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
        
      case 1: // Event Details
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="venue">Venue*</Label>
              <div className="relative">
                <Map className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="venue"
                  className="pl-10"
                  placeholder="Event location (e.g. Tech Park Auditorium)"
                  value={formData.venue}
                  onChange={(e) => updateFormData('venue', e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="event-date">Event Date & Time*</Label>
                <div className="relative mt-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left",
                          !formData.event_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.event_date ? (
                          format(formData.event_date, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 pointer-events-auto">
                      <Calendar
                        mode="single"
                        selected={formData.event_date}
                        onSelect={(date) => date && updateFormData('event_date', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="event-time">Event Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="event-time"
                    type="time"
                    className="pl-10"
                    onChange={(e) => {
                      const newDate = new Date(formData.event_date);
                      const [hours, minutes] = e.target.value.split(':');
                      newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
                      updateFormData('event_date', newDate);
                    }}
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="registration-deadline">Registration Deadline*</Label>
                <div className="relative mt-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left",
                          !formData.registration_deadline && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.registration_deadline ? (
                          format(formData.registration_deadline, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 pointer-events-auto">
                      <Calendar
                        mode="single"
                        selected={formData.registration_deadline}
                        onSelect={(date) => date && updateFormData('registration_deadline', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deadline-time">Deadline Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="deadline-time"
                    type="time"
                    className="pl-10"
                    onChange={(e) => {
                      const newDate = new Date(formData.registration_deadline);
                      const [hours, minutes] = e.target.value.split(':');
                      newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
                      updateFormData('registration_deadline', newDate);
                    }}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="max_participants">
                Maximum Participants 
                <span className="text-sm text-gray-500 ml-2">(Optional, leave empty for unlimited)</span>
              </Label>
              <Input
                id="max_participants"
                type="number"
                placeholder="Maximum number of participants allowed"
                value={formData.max_participants || ''}
                onChange={(e) => updateFormData('max_participants', e.target.value ? parseInt(e.target.value) : undefined)}
                min={1}
              />
            </div>
          </div>
        );
        
      case 2: // Requirements
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements & Prerequisites</Label>
              <Textarea
                id="requirements"
                className="min-h-[150px]"
                placeholder="Specify any prerequisites or requirements for attendees (e.g., laptop, software, prior knowledge)"
                value={formData.requirements || ''}
                onChange={(e) => updateFormData('requirements', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder="Add tags (e.g., AI, Engineering)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-3">
                {(formData.tags || []).map((tag) => (
                  <div 
                    key={tag}
                    className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full px-3 py-1 text-sm flex items-center gap-1"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-gray-500 hover:text-red-500 focus:outline-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
        
      case 3: // Media
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="image">Event Banner Image</Label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
                {formData.image ? (
                  <div className="space-y-4">
                    <div className="aspect-video w-full overflow-hidden rounded-lg">
                      <img 
                        src={URL.createObjectURL(formData.image)} 
                        alt="Event banner preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex justify-center">
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => updateFormData('image', null)}
                      >
                        Replace Image
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-center">
                      <Image className="h-12 w-12 text-gray-400" />
                    </div>
                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer rounded-md bg-white dark:bg-gray-900 font-medium text-primary hover:underline focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
                      >
                        <span>Upload a file</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
        
      case 4: // Review
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-4">Event Summary</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Title</p>
                    <p className="font-medium">{formData.title}</p>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Category</p>
                    <p>{formData.category}</p>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Venue</p>
                    <p>{formData.venue}</p>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Event Date & Time</p>
                    <p>{format(formData.event_date, "PPP 'at' p")}</p>
                  </div>
                </div>
                
                <div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Registration Deadline</p>
                    <p>{format(formData.registration_deadline, "PPP 'at' p")}</p>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Max Participants</p>
                    <p>{formData.max_participants || 'Unlimited'}</p>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Tags</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(formData.tags || []).length > 0 ? (
                        formData.tags!.map((tag) => (
                          <span key={tag} className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full text-xs">
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <p className="text-sm text-gray-500">Description</p>
                <p className="whitespace-pre-line">{formData.description}</p>
              </div>
              
              {formData.requirements && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Requirements</p>
                  <p className="whitespace-pre-line">{formData.requirements}</p>
                </div>
              )}
              
              {formData.image && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">Event Banner</p>
                  <img 
                    src={URL.createObjectURL(formData.image)} 
                    alt="Event banner preview" 
                    className="w-full h-40 object-cover rounded-md"
                  />
                </div>
              )}
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-md p-4 flex items-start">
              <Info className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">What happens next?</p>
                <p className="text-sm mt-1">
                  Your event will be submitted for review. Once approved by an admin, it will be visible in the events listing.
                </p>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create New Event</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Fill out the form below to submit your event for approval.
          </p>
        </div>
        
        {/* Progress steps */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {STEPS.map((s, i) => (
              <div 
                key={s.id} 
                className={cn(
                  "flex flex-col items-center",
                  i > 0 && "relative"
                )}
              >
                {/* Step circle */}
                <div 
                  className={cn(
                    "z-10 flex items-center justify-center w-8 h-8 rounded-full border-2",
                    i === step ? "border-srmist-blue bg-srmist-blue text-white" : 
                      i < step ? "border-srmist-blue bg-srmist-blue text-white" : 
                      "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500"
                  )}
                >
                  {i < step ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{i + 1}</span>
                  )}
                </div>
                
                {/* Step label (visible on larger screens) */}
                <div className="hidden md:block absolute top-0 -ml-10 text-center mt-16 w-20">
                  <p 
                    className={cn(
                      "text-xs font-medium", 
                      i === step ? "text-srmist-blue" : 
                        i < step ? "text-srmist-blue" : 
                        "text-gray-500"
                    )}
                  >
                    {s.title}
                  </p>
                </div>
                
                {/* Connecting line */}
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute left-0 top-4 -ml-0.5 h-0.5 w-[125%] bg-gray-300 dark:bg-gray-700">
                    <div 
                      className={cn(
                        "h-full bg-srmist-blue transition-all duration-500 ease-in-out",
                        i < step ? "w-full" : "w-0"
                      )}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Step labels on small screens */}
          <div className="md:hidden flex justify-center mt-4">
            <p className="text-sm font-medium text-srmist-blue">
              {STEPS[step].title}
            </p>
          </div>
        </div>
        
        {/* Form */}
        <Card>
          <CardContent className="pt-6">
            <form>
              {renderFormStep()}
              
              <div className="mt-8 flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={step === 0}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={isSubmitting}
                >
                  {step === STEPS.length - 1 ? (
                    isSubmitting ? 'Submitting...' : 'Submit Event'
                  ) : (
                    <>
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CreateEventPage;
