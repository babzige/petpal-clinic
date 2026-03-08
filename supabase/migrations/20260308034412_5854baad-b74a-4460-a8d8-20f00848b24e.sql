
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'doctor', 'pet_owner');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Animals table
CREATE TABLE public.animals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  breed TEXT,
  age_years NUMERIC,
  weight_kg NUMERIC,
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can manage own animals" ON public.animals FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Doctors can view all animals" ON public.animals FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'doctor'));
CREATE POLICY "Admins can view all animals" ON public.animals FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Clinics table
CREATE TABLE public.clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  opening_hours TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinics viewable by all authenticated" ON public.clinics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage clinics" ON public.clinics FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES auth.users(id),
  animal_id UUID REFERENCES public.animals(id) ON DELETE CASCADE NOT NULL,
  clinic_id UUID REFERENCES public.clinics(id),
  appointment_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners see own appointments" ON public.appointments FOR SELECT USING (auth.uid() = pet_owner_id);
CREATE POLICY "Owners create appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = pet_owner_id);
CREATE POLICY "Owners update own appointments" ON public.appointments FOR UPDATE USING (auth.uid() = pet_owner_id);
CREATE POLICY "Doctors see assigned appointments" ON public.appointments FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'doctor'));
CREATE POLICY "Doctors update appointments" ON public.appointments FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'doctor'));
CREATE POLICY "Admins manage appointments" ON public.appointments FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users mark messages read" ON public.messages FOR UPDATE USING (auth.uid() = receiver_id);

-- Symptoms table for first aid guidance
CREATE TABLE public.symptoms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  first_aid_guidance TEXT,
  species TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.symptoms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Symptoms viewable by all authenticated" ON public.symptoms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage symptoms" ON public.symptoms FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Symptom reports
CREATE TABLE public.symptom_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID REFERENCES public.animals(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  symptom_id UUID REFERENCES public.symptoms(id),
  description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'low',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.symptom_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage own reports" ON public.symptom_reports FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Doctors view reports" ON public.symptom_reports FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'doctor'));
CREATE POLICY "Admins view reports" ON public.symptom_reports FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for auto-creating profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'pet_owner'));
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_animals_updated_at BEFORE UPDATE ON public.animals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed some symptoms data
INSERT INTO public.symptoms (name, description, severity, first_aid_guidance, species) VALUES
('Vomiting', 'Repeated vomiting or retching', 'medium', 'Withhold food for 12-24 hours. Offer small amounts of water. If vomiting persists more than 24 hours or contains blood, seek emergency vet care immediately.', 'dog'),
('Limping', 'Favoring one leg or refusing to bear weight', 'medium', 'Rest the animal. Check paw pads for foreign objects. Apply cold compress for 15 minutes. If limping persists beyond 24 hours, schedule a vet visit.', 'dog'),
('Excessive Scratching', 'Persistent scratching, biting, or licking skin', 'low', 'Check for fleas or ticks. Bathe with gentle oatmeal shampoo. Prevent scratching with an e-collar if skin is broken. Schedule a vet visit for proper diagnosis.', 'dog'),
('Difficulty Breathing', 'Labored breathing, wheezing, or rapid breathing', 'critical', 'EMERGENCY: Keep the animal calm and cool. Do not obstruct airways. Transport to emergency vet immediately. This can be life-threatening.', 'dog'),
('Loss of Appetite', 'Refusing food for more than 24 hours', 'low', 'Offer favorite treats or warm food to increase aroma. Ensure fresh water is available. If appetite does not return within 48 hours, consult a veterinarian.', 'cat'),
('Lethargy', 'Unusual tiredness or lack of energy', 'medium', 'Monitor temperature if possible (normal: 101-102.5°F for dogs/cats). Ensure comfortable rest area. If lethargy persists more than 24 hours with other symptoms, see a vet.', 'dog'),
('Eye Discharge', 'Unusual discharge from one or both eyes', 'low', 'Gently clean with warm, damp cloth. Do not use human eye drops. If discharge is green/yellow or eye is swollen, schedule a vet appointment.', 'cat'),
('Seizures', 'Uncontrolled shaking, convulsions, or collapse', 'critical', 'EMERGENCY: Do NOT restrain the animal. Clear the area of hazards. Time the seizure. Do not put anything in the mouth. Transport to emergency vet after seizure stops.', 'dog');
