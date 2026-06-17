// ─── Cargar datos previos si existen ─────────────────────────────────────────
const guardado = sessionStorage.getItem('ec0217_datos');
if (guardado) {
const d = JSON.parse(guardado);
document.getElementById('nombreCurso').value  = d.nombreCurso  || '';
document.getElementById('instructor').value   = d.instructor   || '';
document.getElementById('lugar').value        = d.lugar        || '';
document.getElementById('fecha').value        = d.fecha        || '';
document.getElementById('duracion').value     = d.duracion     || '';
document.getElementById('participantes').value = d.participantes || '';
document.getElementById('perfil').value       = d.perfil       || '';
document.getElementById('disenador').value    = d.disenador    || '';
// Marcar Paso 1 como completado en el sidebar si ya venía guardado
if (sessionStorage.getItem('ec0217_datos_completo') === 'true') {
    document.getElementById('nav-1').classList.add('completed');
    document.getElementById('nav-2').classList.remove('disabled');
}
}
// ─── Validación ───────────────────────────────────────────────────────────────
const campos = [
{ id: 'nombreCurso',   errId: 'err-nombreCurso',   tipo: 'texto' },
{ id: 'instructor',    errId: 'err-instructor',     tipo: 'texto' },
{ id: 'lugar',         errId: 'err-lugar',          tipo: 'texto' },
{ id: 'fecha',         errId: 'err-fecha',          tipo: 'texto' },
{ id: 'duracion',      errId: 'err-duracion',       tipo: 'numero', min: 120 },
{ id: 'participantes', errId: 'err-participantes',  tipo: 'numero', min: 4 },
{ id: 'perfil',        errId: 'err-perfil',         tipo: 'texto' },
{ id: 'disenador',     errId: 'err-disenador',      tipo: 'texto' },
];
function limpiarErrores() {
campos.forEach(({ id, errId }) => {
    document.getElementById(id).classList.remove('error');
    document.getElementById(errId).style.display = 'none';
});
}
function mostrarError(id, errId) {
document.getElementById(id).classList.add('error');
document.getElementById(errId).style.display = 'block';
document.getElementById(id).focus();
}
function validar() {
limpiarErrores();
let valido = true;
let primerError = null;
for (const campo of campos) {
    const el = document.getElementById(campo.id);
    const valor = el.value.trim();
    if (!valor) {
    mostrarError(campo.id, campo.errId);
    if (!primerError) primerError = campo.id;
    valido = false;
    continue;
    }
    if (campo.tipo === 'numero') {
    const num = parseInt(valor, 10);
    if (isNaN(num) || num < campo.min) {
        mostrarError(campo.id, campo.errId);
        if (!primerError) primerError = campo.id;
        valido = false;
    }
    }
}
if (primerError) {
    document.getElementById(primerError).scrollIntoView({ behavior: 'smooth', block: 'center' });
}
return valido;
}
// ─── Guardar y avanzar ────────────────────────────────────────────────────────
document.getElementById('btnSiguiente').addEventListener('click', () => {
if (!validar()) return;
const datos = {
    nombreCurso:   document.getElementById('nombreCurso').value.trim(),
    instructor:    document.getElementById('instructor').value.trim(),
    lugar:         document.getElementById('lugar').value.trim(),
    fecha:         document.getElementById('fecha').value,
    duracion:      parseInt(document.getElementById('duracion').value, 10),
    participantes: parseInt(document.getElementById('participantes').value, 10),
    perfil:        document.getElementById('perfil').value.trim(),
    disenador:     document.getElementById('disenador').value.trim(),
};
sessionStorage.setItem('ec0217_datos', JSON.stringify(datos));
sessionStorage.setItem('ec0217_datos_completo', 'true');
window.location.href = 'index';
});
// ─── Copiar instructor → diseñador ───────────────────────────────────────────────
document.getElementById('btnCopiarInstructor').addEventListener('click', () => {
const valor = document.getElementById('instructor').value.trim();
if (valor) {
    document.getElementById('disenador').value = valor;
    // Limpiar error si lo había
    document.getElementById('disenador').classList.remove('error');
    document.getElementById('err-disenador').style.display = 'none';
}
});
// ─── Menú hamburguesa ─────────────────────────────────────────────────────────
document.getElementById('menuToggle').addEventListener('click', () => {
document.getElementById('sidebar').classList.toggle('active');
});