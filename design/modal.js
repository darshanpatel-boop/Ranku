// Aide commune aux pages de test des fenêtres d'ajout (données fictives sur les vraies affiches de mock.js).
const META = ['Série · 2013', 'Série · 2009', 'Série · 2006', 'Série · 2023', 'Série · 2020', 'Série · 2019', 'Série · 1999', 'Série · 2002', 'Série · 2016', 'Série · 2011', 'Série · 1998', 'Série · 2011', 'Série · 2019', 'Série · 2022', 'Série · 2022', 'Série · 2016', 'Série · 2006'];
const SCORES = [8.56, 9.1, 8.6, 9.3, 8.7, 8.4, 8.7, 8.0, 7.9, 9.1, 8.8, 9.0, 8.7, 8.6, 8.5, 8.4, 8.7];
const ICON = '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>';
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const found = (q) => MOCK.map((m, i) => ({ ...m, i: m.i, n: i, meta: META[i], score: SCORES[i] })).filter((m) => norm(m.t).includes(norm(q.trim())));
document.body.insertAdjacentHTML('afterbegin', '<div class="behind"><i></i><i></i><i></i><i></i><i></i></div>');
