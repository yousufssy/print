import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useOrder, useCreateOrder, useUpdateOrder, useCustomers } from '../hooks/useApi';
import { Card, FormGroup, SectionDiv, CheckItem, Loading, Btn } from '../components/ui';
import type { Order } from '../types';

const CHECKBOX_FIELDS = ['varnich','uv','uv_Spot','seluvan_lum','seluvan_mat','Tad3em','Tay','harary','rolling','Printed','Billed','Reseved'] as const;

export default function OrderFormPage() {
  const { id, year } = useParams<{ id?: string; year?: string }>();
  const isEdit = !!(id && year);
  const navigate = useNavigate();

  const { data: existing, isLoading } = useOrder(id ?? '', year ?? '');
  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder(id ?? '', year ?? '');
  const { data: customers = [] } = useCustomers();

  const [checks, setChecks] = useState<Record<string, boolean>>({});

  const { register, handleSubmit, reset, watch, setValue } = useForm<Order>();

  const currentYear = String(new Date().getFullYear());

  // Fill form when editing
  useEffect(() => {
    if (existing) {
      reset(existing);
      const c: Record<string, boolean> = {};
      CHECKBOX_FIELDS.forEach(f => { c[f] = existing[f] === 'True'; });
      setChecks(c);
    } else {
      reset({ Year: currentYear });
    }
  }, [existing, reset]);

  const onSubmit = async (data: Order) => {
    // Merge checkboxes
    CHECKBOX_FIELDS.forEach(f => { (data as any)[f] = checks[f] ? 'True' : 'False'; });

    if (isEdit) {
      await updateOrder.mutateAsync(data);
    } else {
      await createOrder.mutateAsync(data);
    }
    navigate('/orders');
  };

  if (isLoading) return <Loading />;

  const isSaving = createOrder.isPending || updateOrder.isPending;

  const G = ({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) => (
    <FormGroup label={label} required={req}>{children}</FormGroup>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => navigate('/orders')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>←</button>
        <h1 style={{ fontSize: 20, fontWeight: 900 }}>
          {isEdit ? `✏️ تعديل الطلب: ${id}` : '➕ طلب جديد'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>

        {/* ── بيانات أساسية ── */}
        <Card title="📋 بيانات الطلب الأساسية">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            <G label="رقم الأمر" req><input className="fc" {...register('ID', { required: true })} placeholder="مثال: 65982" /></G>
            <G label="السنة" req><input className="fc" {...register('Year', { required: true })} /></G>
            <G label="رقم المتسلسل"><input className="fc" {...register('Ser')} /></G>
            <G label="المرجع"><input className="fc" {...register('marji3')} /></G>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginTop: 12 }}>
            <G label="الزبون" req>
              <input className="fc" {...register('Customer', { required: true })} list="customers-list" placeholder="ابحث عن الزبون..." />
              <datalist id="customers-list">
                {customers.map(c => <option key={c._row_id} value={c.Customer} />)}
              </datalist>
            </G>
            <G label="النشاط"><input className="fc" {...register('Activity')} readOnly /></G>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginTop: 12 }}>
            <G label="تاريخ الورود"><input className="fc" type="date" {...register('date_come')} /></G>
            <G label="موعد التسليم"><input className="fc" type="date" {...register('Apoent_Delv_date')} /></G>
            <G label="الكمية المطلوبة"><input className="fc" type="number" {...register('Demand')} /></G>
            <G label="الكمية الكبرى"><input className="fc" type="number" {...register('grnd_qunt')} /></G>
          </div>
        </Card>

        {/* ── مواصفات المطبوعة ── */}
        <Card title="🎨 مواصفات المطبوعة">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
            <G label="نوع القالب">
              <select className="fc" {...register('Pattern')}>
                <option value="">—</option>
                {['علبة','كرتون','بروشور','استيكر','غلاف','وراقة دحابة'].map(v => <option key={v}>{v}</option>)}
              </select>
            </G>
            <G label="الاسم الهندسي / الوصف"><input className="fc" {...register('Eng_Name')} /></G>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginTop: 12 }}>
            <G label="الوحدة">
              <select className="fc" {...register('unit')}>
                <option>ورقة</option><option>كيلو</option><option>متر</option>
              </select>
            </G>
            <G label="الكود"><input className="fc" {...register('Code')} /></G>
            <G label="كود المادة"><input className="fc" {...register('Code_M')} /></G>
            <G label="رقم المونتاج"><input className="fc" {...register('MontagNum')} /></G>
          </div>

          <SectionDiv label="الأبعاد النهائية" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            <G label="الطول (طري)"><input className="fc" type="number" step="0.01" {...register('final_size_tall')} /></G>
            <G label="العرض (طري)"><input className="fc" type="number" step="0.01" {...register('final_size_width')} /></G>
            <G label="الطول (قاسي)"><input className="fc" type="number" step="0.01" {...register('final_size_tall2')} /></G>
            <G label="العرض (قاسي)"><input className="fc" type="number" step="0.01" {...register('final_size_width2')} /></G>
            <G label="الطول النهائي"><input className="fc" type="number" step="0.01" {...register('LongU')} /></G>
            <G label="العرض النهائي"><input className="fc" type="number" step="0.01" {...register('WedthU')} /></G>
            <G label="الارتفاع"><input className="fc" type="number" step="0.01" {...register('HightU')} /></G>
            <G label="الليسان"><input className="fc" type="number" step="0.01" {...register('Lesan')} /></G>
          </div>

          <SectionDiv label="مواصفات الطباعة" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            <G label="عدد الألوان"><input className="fc" type="number" {...register('Clr_qunt')} /></G>
            <G label="الطبع على"><input className="fc" type="number" {...register('print_on')} /></G>
            <G label="كمية الطبع"><input className="fc" type="number" {...register('Qunt_of_print-on')} /></G>
            <G label="وحدة الشيت"><input className="fc" type="number" {...register('sheet_unit_qunt')} /></G>
            <G label="آلة الطباعة"><input className="fc" {...register('Machin_Print')} /></G>
            <G label="آلة التقطيع"><input className="fc" {...register('Machin_Cut')} /></G>
            <G label="معلومات تقنية"><input className="fc" {...register('teq_inf')} /></G>
            <G label="معلومات إضافية"><input className="fc" {...register('inf_req')} /></G>
          </div>

          <SectionDiv label="التشطيب" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
            {[
              { key: 'varnich', label: 'ورنيش' },
              { key: 'uv', label: 'UV كامل' },
              { key: 'uv_Spot', label: 'UV بقعي' },
              { key: 'seluvan_lum', label: 'سلفان لميع' },
              { key: 'seluvan_mat', label: 'سلفان مات' },
              { key: 'Tad3em', label: 'تدعيم' },
              { key: 'Tay', label: 'تطوية' },
              { key: 'harary', label: 'حراري' },
              { key: 'rolling', label: 'رولينج' },
            ].map(({ key, label }) => (
              <CheckItem key={key} label={label}
                checked={!!checks[key]}
                onChange={v => setChecks(c => ({ ...c, [key]: v }))} />
            ))}
          </div>
        </Card>

        {/* ── مشاكل الجودة ── */}
        <Card title="🔍 مراقبة الجودة">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ border: '1.5px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '9px 13px', background: 'rgba(214,137,16,.1)', color: 'var(--warn)', fontSize: 12, fontWeight: 700, borderBottom: '1px solid rgba(214,137,16,.2)' }}>
                ⚙️ مشاكل أثناء التصنيع
              </div>
              <div style={{ padding: 12 }}>
                <textarea className="fc" {...register('Proplems_Pro')} rows={4} placeholder="اكتب المشاكل..." />
              </div>
            </div>
            <div style={{ border: '1.5px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '9px 13px', background: 'rgba(192,57,43,.08)', color: 'var(--red)', fontSize: 12, fontWeight: 700, borderBottom: '1px solid rgba(192,57,43,.15)' }}>
                🚨 مشاكل من الزبون
              </div>
              <div style={{ padding: 12 }}>
                <textarea className="fc" {...register('Proplems_Cus')} rows={4} placeholder="مشاكل أبلغ عنها الزبون..." />
              </div>
            </div>
          </div>
        </Card>

        {/* ── الحالة ── */}
        <Card title="🚚 الحالة والتسليم">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            <CheckItem label="✅ مطبوعة"    checked={!!checks.Printed} onChange={v => setChecks(c => ({ ...c, Printed: v }))} />
            <CheckItem label="🧾 لها فاتورة" checked={!!checks.Billed}  onChange={v => setChecks(c => ({ ...c, Billed: v }))} />
            <CheckItem label="📦 مستلمة"    checked={!!checks.Reseved} onChange={v => setChecks(c => ({ ...c, Reseved: v }))} />
            <G label="ملاحظات"><input className="fc" {...register('Notes')} /></G>
          </div>
        </Card>

        {/* ── Footer ── */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--border)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>سنة العمل: <strong>{watch('Year') || currentYear}</strong></span>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="outline" type="button" onClick={() => navigate('/orders')}>إلغاء</Btn>
            <Btn variant="primary" type="submit" disabled={isSaving}>
              {isSaving ? '⏳ جاري الحفظ...' : '💾 حفظ الطلب'}
            </Btn>
          </div>
        </div>

      </form>
    </div>
  );
}
