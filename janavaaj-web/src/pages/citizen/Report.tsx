import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Camera, MapPin, X, Crosshair, Send, Sparkles, ShieldCheck, Cpu, Navigation } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select, Textarea, Input, FieldShell } from '../../components/ui/form';
import { LocationPicker } from '../../components/map/maps';
import type { LatLng } from '../../components/map/maps';
import { useCategories } from '../../hooks/queries';
import { useCreateRequest } from '../../hooks/mutations';
import { uploadFiles } from '../../api/endpoints';
import { FALLBACK_CATEGORIES } from '../../lib/categories';
import { toast } from '../../lib/toast';
import { getErrorMessage } from '../../lib/errors';

const MAX_PHOTOS = 5;
const MAX_SIZE = 5 * 1024 * 1024;

export default function Report() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const locationState = useLocation();
  const [searchParams] = useSearchParams();
  const { data: categories } = useCategories();
  const createRequest = useCreateRequest();
  const cats = categories ?? FALLBACK_CATEGORIES;

  const stateData = (locationState.state as { prefillCategory?: string; prefillDescription?: string; prefillAddress?: string } | null) || null;

  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState(stateData?.prefillDescription || searchParams.get('description') || '');
  const [address, setAddress] = useState(stateData?.prefillAddress || searchParams.get('address') || '');
  const [location, setLocation] = useState<LatLng | null>({ lat: 18.5204, lng: 73.8567 });
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-match prefilled category from voice/search
  useEffect(() => {
    const targetCat = stateData?.prefillCategory || searchParams.get('category');
    if (targetCat && cats.length > 0) {
      const match = cats.find(
        (c) => c.name.toLowerCase().includes(targetCat.toLowerCase()) ||
               c.slug.toLowerCase().includes(targetCat.toLowerCase())
      );
      if (match) {
        setCategoryId(String(match.id));
      }
    }
  }, [stateData, searchParams, cats]);

  const onPickFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list);
    const valid = incoming.filter((f) => {
      if (f.size > MAX_SIZE) {
        toast.error(`${f.name} is larger than 5MB.`);
        return false;
      }
      return true;
    });
    const combined = [...files, ...valid].slice(0, MAX_PHOTOS);
    setFiles(combined);
    setPreviews(combined.map((f) => URL.createObjectURL(f)));
  };

  const removeFile = (i: number) => {
    const next = files.filter((_, idx) => idx !== i);
    setFiles(next);
    setPreviews(next.map((f) => URL.createObjectURL(f)));
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not available in this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => toast.error('Could not get your location. Tap the map instead.')
    );
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!categoryId) e.category = 'Please choose a category.';
    if (description.trim().length < 10) e.description = 'Please describe the issue (min 10 characters).';
    if (!location) e.location = 'Please set the location on the map.';
    if (files.length < 1) e.photos = 'Please add at least one photo.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate() || !location) return;
    setBusy(true);
    try {
      const uploaded = await uploadFiles(files);
      const result = await createRequest.mutateAsync({
        categoryId: Number(categoryId),
        description: description.trim(),
        latitude: location.lat,
        longitude: location.lng,
        addressText: address.trim() || undefined,
        photoUploadIds: uploaded.map((u) => u.uploadId),
        inputType: 'PHOTO',
      });
      toast.success(t('report.successBody'));
      navigate(`/app/citizen/complaint/${result.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title={t('report.title')} subtitle={t('report.subtitle')} />

      {/* Smart Civic Services Indicator Strip */}
      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs text-slate-600 shadow-xs">
        <span className="flex items-center gap-1 font-bold text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Smart Civic Services:
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft/50 px-2 py-0.5 text-[11px] font-medium text-primary">
          <Cpu className="h-3 w-3" /> AI Classification
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-bg px-2 py-0.5 text-[11px] font-medium text-slate-700">
          <Navigation className="h-3 w-3" /> GPS Geotagging
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-bg px-2 py-0.5 text-[11px] font-medium text-slate-700">
          <ShieldCheck className="h-3 w-3" /> Duplicate Detection
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-bg px-2 py-0.5 text-[11px] font-medium text-slate-700">
          Smart Priority
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-bg px-2 py-0.5 text-[11px] font-medium text-slate-700">
          Department Routing
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
          Resolution Proof
        </span>
      </div>

      {/* AI Pre-fill Review Banner if navigated from Voice / AI Dock */}
      {stateData && (
        <div className="mb-6 flex items-start gap-3 rounded-card border border-primary/20 bg-primary-soft/30 p-4">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="text-xs">
            <h4 className="font-bold text-slate-900">AI Complaint Draft Loaded from Janavaaj Assistant</h4>
            <p className="mt-0.5 text-slate-600">
              Please review the detected problem details, attach at least one photo as verification evidence, and confirm your submission.
            </p>
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="grid gap-6 lg:grid-cols-3"
      >
        <div className="space-y-6 lg:col-span-2">
          <Card className="space-y-4">
            <Select
              id="category"
              label={t('report.category')}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              error={errors.category}
            >
              <option value="">{t('report.selectCategory')}</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>

            <Textarea
              id="description"
              label={t('report.description')}
              rows={4}
              placeholder={t('report.descriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              error={errors.description}
            />

            <Input
              id="address"
              label={`${t('report.address')} (${t('common.optional')})`}
              placeholder="e.g. Near FC Road signal"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </Card>

          <Card>
            <FieldShell label={t('report.photos')} hint={t('report.photosHint')} error={errors.photos}>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {previews.map((src, i) => (
                  <div key={src} className="relative aspect-square overflow-hidden rounded-input border border-border">
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute right-1 top-1 rounded-full bg-slate-900/70 p-1 text-white hover:bg-slate-900"
                      aria-label="Remove photo"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {files.length < MAX_PHOTOS && (
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-input border-2 border-dashed border-border text-slate-400 transition-colors hover:border-primary hover:text-primary">
                    <Camera className="h-6 w-6" />
                    <span className="text-xs font-medium">{t('report.addPhotos')}</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => onPickFiles(e.target.files)}
                    />
                  </label>
                )}
              </div>
            </FieldShell>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <FieldShell label={t('report.location')} hint={t('report.locationHint')} error={errors.location}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<Crosshair className="h-4 w-4" />}
                onClick={useMyLocation}
                className="mb-3"
              >
                {t('report.useMyLocation')}
              </Button>
              <LocationPicker value={location} onChange={setLocation} height={260} />
              {location && (
                <p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="h-3.5 w-3.5" />
                  {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                </p>
              )}
            </FieldShell>
          </Card>

          <Button type="submit" fullWidth size="lg" loading={busy} leftIcon={<Send className="h-5 w-5" />}>
            {busy ? t('report.submitting') : t('report.submitReport')}
          </Button>
        </div>
      </form>
    </div>
  );
}
