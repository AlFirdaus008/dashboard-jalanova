-- Reference names/status only; simulated coordinates are not used to assign real reports.
insert into public.road_registry(id,road_name,authority,owner) values
('SBY-01','Jl. Ahmad Yani','national','Pemerintah pusat / Kementerian PU'),
('SBY-02','Jl. Raya Darmo','city','Pemkot Surabaya / DSDABM'),
('SBY-03','Jl. Mayjen Sungkono','city','Pemkot Surabaya / DSDABM'),
('SBY-04','Jl. HR Muhammad','city','Pemkot Surabaya / DSDABM'),
('SBY-05','Jl. Kertajaya','city','Pemkot Surabaya / DSDABM'),
('SBY-06','Jl. Rungkut Industri Raya','city','Pemkot Surabaya / DSDABM'),
('SBY-07','Jl. Kenjeran','national','Pemerintah pusat / Kementerian PU'),
('SBY-08','Jl. Dupak','city','Pemkot Surabaya / DSDABM'),
('SBY-09','Jl. Mastrip','provincial','Pemprov Jawa Timur / Dinas PU Bina Marga'),
('SBY-10','Jl. Dr. Ir. H. Soekarno (MERR)','city','Pemkot Surabaya / DSDABM'),
('SBY-11','Jl. Basuki Rahmat','city','Pemkot Surabaya / DSDABM'),
('SBY-12','Jl. Tunjungan','city','Pemkot Surabaya / DSDABM'),
('SBY-13','Jl. Perak Timur','national','Pemerintah pusat / Kementerian PU'),
('SBY-14','Jl. Raya Wiyung','city','Pemkot Surabaya / DSDABM'),
('SBY-15','Jl. Manukan Kulon','city','Pemkot Surabaya / DSDABM')
on conflict(id) do update set road_name=excluded.road_name,authority=excluded.authority,owner=excluded.owner;
