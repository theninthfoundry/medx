package com.blackwell;

import javax.swing.*;
import javax.swing.border.*;
import javax.swing.table.DefaultTableModel;
import java.awt.*;
import java.sql.*;
import java.time.LocalDate;
import java.time.LocalTime;

public class HospitalRecordsApp extends JFrame {
    private static final Color BLACK = new Color(15, 15, 15);
    private static final Color WHITE = Color.WHITE;
    private static final Color PAPER = new Color(247, 247, 245);
    private static final Color MUTED = new Color(105, 105, 105);
    private static final String DB_URL = "jdbc:sqlite:blackwell.db";

    private final CardLayout cards = new CardLayout();
    private final JPanel content = new JPanel(cards);
    private JLabel status = new JLabel("  SYSTEM READY");
    private JTable patientsTable, doctorsTable, appointmentsTable, recordsTable;
    private DefaultTableModel patientsModel, doctorsModel, appointmentsModel, recordsModel;

    public HospitalRecordsApp() {
        super("BLACKWELL — Hospital Records");
        initDatabase();
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setMinimumSize(new Dimension(1050, 700));
        setSize(1240, 800);
        setLocationRelativeTo(null);
        getContentPane().setBackground(PAPER);
        setLayout(new BorderLayout());
        add(buildSidebar(), BorderLayout.WEST);
        add(buildMain(), BorderLayout.CENTER);
        refreshAll();
    }

    private Connection connect() throws SQLException {
        Connection c = DriverManager.getConnection(DB_URL);
        try (Statement s = c.createStatement()) { s.execute("PRAGMA foreign_keys = ON"); }
        return c;
    }

    private void initDatabase() {
        String[] sql = {
            "CREATE TABLE IF NOT EXISTS patients (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, age INTEGER NOT NULL CHECK(age BETWEEN 0 AND 120), gender TEXT NOT NULL, phone TEXT NOT NULL, blood_group TEXT NOT NULL, address TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP)",
            "CREATE TABLE IF NOT EXISTS doctors (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, specialty TEXT NOT NULL, phone TEXT NOT NULL, room TEXT NOT NULL)",
            "CREATE TABLE IF NOT EXISTS appointments (id INTEGER PRIMARY KEY AUTOINCREMENT, patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE, doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE, visit_date TEXT NOT NULL, visit_time TEXT NOT NULL, reason TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'Scheduled')",
            "CREATE TABLE IF NOT EXISTS medical_records (id INTEGER PRIMARY KEY AUTOINCREMENT, patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE, record_date TEXT NOT NULL, diagnosis TEXT NOT NULL, treatment TEXT NOT NULL, notes TEXT NOT NULL)"
        };
        try (Connection c = connect(); Statement s = c.createStatement()) {
            for (String q : sql) s.execute(q);
        } catch (SQLException e) { showError("Database setup failed: " + e.getMessage()); }
    }

    private JPanel buildSidebar() {
        JPanel side = new JPanel();
        side.setBackground(BLACK);
        side.setPreferredSize(new Dimension(230, 0));
        side.setLayout(new BoxLayout(side, BoxLayout.Y_AXIS));
        side.setBorder(new EmptyBorder(28, 18, 22, 18));

        JLabel wordmark = new JLabel("BLACKWELL");
        wordmark.setForeground(WHITE);
        wordmark.setFont(new Font("SansSerif", Font.BOLD, 25));
        wordmark.setAlignmentX(Component.LEFT_ALIGNMENT);
        side.add(wordmark);
        JLabel subtitle = new JLabel("HOSPITAL RECORDS");
        subtitle.setForeground(new Color(175,175,175));
        subtitle.setFont(new Font("SansSerif", Font.BOLD, 10));
        subtitle.setBorder(new EmptyBorder(5, 1, 34, 0));
        subtitle.setAlignmentX(Component.LEFT_ALIGNMENT);
        side.add(subtitle);

        navButton(side, "OVERVIEW", "Dashboard");
        navButton(side, "PATIENTS", "Patients");
        navButton(side, "DOCTORS", "Doctors");
        navButton(side, "APPOINTMENTS", "Appointments");
        navButton(side, "MEDICAL RECORDS", "Medical Records");

        side.add(Box.createVerticalGlue());
        JLabel foot = new JLabel("<html><font color='#999999'>DESKTOP SYSTEM<br>JAVA + SQLITE</font></html>");
        foot.setFont(new Font("SansSerif", Font.BOLD, 10));
        foot.setAlignmentX(Component.LEFT_ALIGNMENT);
        side.add(foot);
        return side;
    }

    private void navButton(JPanel side, String label, String page) {
        JButton b = new JButton(label);
        b.setAlignmentX(Component.LEFT_ALIGNMENT);
        b.setMaximumSize(new Dimension(195, 43));
        b.setPreferredSize(new Dimension(195, 43));
        b.setHorizontalAlignment(SwingConstants.LEFT);
        b.setFont(new Font("SansSerif", Font.BOLD, 11));
        b.setForeground(WHITE);
        b.setBackground(BLACK);
        b.setBorder(new EmptyBorder(0, 12, 0, 8));
        b.setFocusPainted(false);
        b.setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
        b.addActionListener(e -> { cards.show(content, page); if (page.equals("Dashboard")) refreshDashboard(); });
        b.addMouseListener(new java.awt.event.MouseAdapter() {
            public void mouseEntered(java.awt.event.MouseEvent e) { b.setBackground(new Color(45,45,45)); }
            public void mouseExited(java.awt.event.MouseEvent e) { b.setBackground(BLACK); }
        });
        side.add(b);
        side.add(Box.createVerticalStrut(5));
    }

    private JPanel buildMain() {
        JPanel main = new JPanel(new BorderLayout());
        main.setBackground(PAPER);
        JPanel top = new JPanel(new BorderLayout());
        top.setBackground(WHITE);
        top.setBorder(new CompoundBorder(new MatteBorder(0,0,1,0,new Color(225,225,225)), new EmptyBorder(18,28,18,28)));
        JLabel title = new JLabel("HOSPITAL MANAGEMENT / RECORDS");
        title.setFont(new Font("SansSerif", Font.BOLD, 12));
        title.setForeground(BLACK);
        JLabel date = new JLabel(LocalDate.now().toString());
        date.setFont(new Font("SansSerif", Font.PLAIN, 12));
        date.setForeground(MUTED);
        top.add(title, BorderLayout.WEST); top.add(date, BorderLayout.EAST);
        main.add(top, BorderLayout.NORTH);

        content.setBackground(PAPER);
        content.add(dashboardPage(), "Dashboard");
        content.add(patientsPage(), "Patients");
        content.add(doctorsPage(), "Doctors");
        content.add(appointmentsPage(), "Appointments");
        content.add(recordsPage(), "Medical Records");
        main.add(content, BorderLayout.CENTER);

        status.setFont(new Font("Monospaced", Font.BOLD, 10));
        status.setForeground(MUTED);
        status.setBorder(new EmptyBorder(10, 28, 12, 10));
        main.add(status, BorderLayout.SOUTH);
        return main;
    }

    private JPanel pageShell(String eyebrow, String heading, String description) {
        JPanel p = new JPanel(new BorderLayout(0, 22));
        p.setBackground(PAPER);
        p.setBorder(new EmptyBorder(30, 30, 25, 30));
        JPanel intro = new JPanel();
        intro.setBackground(PAPER);
        intro.setLayout(new BoxLayout(intro, BoxLayout.Y_AXIS));
        JLabel e = new JLabel(eyebrow);
        e.setFont(new Font("SansSerif", Font.BOLD, 10)); e.setForeground(MUTED);
        JLabel h = new JLabel(heading);
        h.setFont(new Font("SansSerif", Font.BOLD, 32)); h.setForeground(BLACK);
        JLabel d = new JLabel(description);
        d.setFont(new Font("SansSerif", Font.PLAIN, 13)); d.setForeground(MUTED);
        e.setAlignmentX(Component.LEFT_ALIGNMENT); h.setAlignmentX(Component.LEFT_ALIGNMENT); d.setAlignmentX(Component.LEFT_ALIGNMENT);
        intro.add(e); intro.add(Box.createVerticalStrut(5)); intro.add(h); intro.add(Box.createVerticalStrut(6)); intro.add(d);
        p.add(intro, BorderLayout.NORTH);
        return p;
    }

    private JPanel dashboardPage() {
        JPanel p = pageShell("CONTROL CENTRE", "Records. In order.", "A clear view of your hospital's essential records.");
        JPanel body = new JPanel(new BorderLayout(0, 18)); body.setBackground(PAPER);
        JPanel metrics = new JPanel(new GridLayout(1,3,14,0)); metrics.setBackground(PAPER);
        metrics.add(metric("REGISTERED PATIENTS", "patientCount"));
        metrics.add(metric("MEDICAL STAFF", "doctorCount"));
        metrics.add(metric("APPOINTMENTS", "appointmentCount"));
        JPanel lower = new JPanel(new GridLayout(1,2,14,0)); lower.setBackground(PAPER);
        lower.add(infoCard("QUICK ACTIONS", new String[]{"Add a patient", "Register a doctor", "Schedule an appointment", "Add a medical record"},
            new Runnable[]{this::addPatient, this::addDoctor, this::addAppointment, this::addRecord}));
        lower.add(infoCard("SYSTEM NOTES", new String[]{"Local SQLite database", "Records persist after closing", "Search and update existing entries", "Use fictional data for demonstrations"}, null));
        body.add(metrics, BorderLayout.NORTH); body.add(lower, BorderLayout.CENTER);
        p.add(body, BorderLayout.CENTER);
        return p;
    }

    private JPanel metric(String label, String key) {
        JPanel box = new JPanel(new BorderLayout(0, 12)); box.setBackground(WHITE);
        box.setBorder(new CompoundBorder(new LineBorder(new Color(225,225,225)), new EmptyBorder(20,18,20,18)));
        JLabel l = new JLabel(label); l.setFont(new Font("SansSerif", Font.BOLD, 10)); l.setForeground(MUTED);
        JLabel value = new JLabel("—"); value.setFont(new Font("SansSerif", Font.BOLD, 38)); value.setForeground(BLACK);
        box.add(l, BorderLayout.NORTH); box.add(value, BorderLayout.CENTER);
        box.putClientProperty("metricKey", key);
        return box;
    }

    private JPanel infoCard(String title, String[] items, Runnable[] actions) {
        JPanel box = new JPanel(); box.setBackground(WHITE); box.setLayout(new BoxLayout(box, BoxLayout.Y_AXIS));
        box.setBorder(new CompoundBorder(new LineBorder(new Color(225,225,225)), new EmptyBorder(20,18,20,18)));
        JLabel h = new JLabel(title); h.setFont(new Font("SansSerif", Font.BOLD, 11)); h.setBorder(new EmptyBorder(0,0,14,0)); h.setAlignmentX(Component.LEFT_ALIGNMENT); box.add(h);
        for (int i=0;i<items.length;i++) {
            final int idx=i;
            if (actions != null) {
                JButton b = new JButton("+   " + items[i].toUpperCase());
                b.setAlignmentX(Component.LEFT_ALIGNMENT); b.setMaximumSize(new Dimension(Integer.MAX_VALUE, 42));
                b.setHorizontalAlignment(SwingConstants.LEFT); b.setFont(new Font("SansSerif", Font.BOLD, 10));
                b.setBackground(WHITE); b.setForeground(BLACK); b.setFocusPainted(false);
                b.setBorder(new CompoundBorder(new MatteBorder(0,0,1,0,new Color(235,235,235)), new EmptyBorder(8,3,8,3)));
                b.addActionListener(e -> actions[idx].run()); box.add(b);
            } else {
                JLabel l = new JLabel("—   " + items[i]); l.setFont(new Font("SansSerif", Font.PLAIN, 12)); l.setBorder(new EmptyBorder(8,0,8,0)); l.setAlignmentX(Component.LEFT_ALIGNMENT); box.add(l);
            }
        }
        return box;
    }

    private JPanel patientsPage() {
        JPanel p = pageShell("PEOPLE / 01", "Patients", "Register and maintain patient details.");
        patientsModel = model("ID","FULL NAME","AGE","GENDER","PHONE","BLOOD GROUP","ADDRESS");
        patientsTable = table(patientsModel);
        p.add(tableArea(patientsTable, new String[]{"Add patient","Edit selected","Delete selected","Refresh"}, new Runnable[]{this::addPatient,this::editPatient,this::deletePatient,this::refreshPatients}), BorderLayout.CENTER);
        return p;
    }

    private JPanel doctorsPage() {
        JPanel p = pageShell("PEOPLE / 02", "Doctors", "Maintain the hospital's medical staff directory.");
        doctorsModel = model("ID","DOCTOR","SPECIALTY","PHONE","ROOM");
        doctorsTable = table(doctorsModel);
        p.add(tableArea(doctorsTable, new String[]{"Add doctor","Edit selected","Delete selected","Refresh"}, new Runnable[]{this::addDoctor,this::editDoctor,this::deleteDoctor,this::refreshDoctors}), BorderLayout.CENTER);
        return p;
    }

    private JPanel appointmentsPage() {
        JPanel p = pageShell("SCHEDULING / 03", "Appointments", "Schedule visits and track their status.");
        appointmentsModel = model("ID","PATIENT","DOCTOR","DATE","TIME","REASON","STATUS");
        appointmentsTable = table(appointmentsModel);
        p.add(tableArea(appointmentsTable, new String[]{"Schedule visit","Edit selected","Delete selected","Refresh"}, new Runnable[]{this::addAppointment,this::editAppointment,this::deleteAppointment,this::refreshAppointments}), BorderLayout.CENTER);
        return p;
    }

    private JPanel recordsPage() {
        JPanel p = pageShell("CLINICAL / 04", "Medical records", "Store diagnosis, treatment and clinical notes.");
        recordsModel = model("ID","PATIENT","DATE","DIAGNOSIS","TREATMENT","NOTES");
        recordsTable = table(recordsModel);
        p.add(tableArea(recordsTable, new String[]{"Add record","View details","Delete selected","Refresh"}, new Runnable[]{this::addRecord,this::viewRecord,this::deleteRecord,this::refreshRecords}), BorderLayout.CENTER);
        return p;
    }

    private JPanel tableArea(JTable table, String[] labels, Runnable[] actions) {
        JPanel area = new JPanel(new BorderLayout(0,12)); area.setBackground(PAPER);
        JPanel tools = new JPanel(new BorderLayout(10,0)); tools.setBackground(PAPER);
        JTextField search = new JTextField(); search.setFont(new Font("SansSerif", Font.PLAIN, 13));
        search.setBorder(new CompoundBorder(new LineBorder(new Color(220,220,220)), new EmptyBorder(10,12,10,12)));
        search.putClientProperty("JTextField.placeholderText", "Search visible records...");
        JButton find = button("SEARCH", true);
        JPanel searchPanel = new JPanel(new BorderLayout(8,0)); searchPanel.setBackground(PAPER); searchPanel.add(search,BorderLayout.CENTER); searchPanel.add(find,BorderLayout.EAST);
        tools.add(searchPanel,BorderLayout.CENTER);
        JPanel btns = new JPanel(new FlowLayout(FlowLayout.LEFT,6,0)); btns.setBackground(PAPER);
        for (int i=0;i<labels.length;i++) { final int idx=i; JButton b=button(labels[i].toUpperCase(), i==0); b.addActionListener(e -> actions[idx].run()); btns.add(b); }
        tools.add(btns,BorderLayout.SOUTH);
        tools.setBorder(new EmptyBorder(0,0,3,0));
        JScrollPane scroll = new JScrollPane(table); scroll.setBorder(new LineBorder(new Color(225,225,225))); scroll.getViewport().setBackground(WHITE);
        find.addActionListener(e -> filterTable(table, search.getText()));
        search.addActionListener(e -> filterTable(table, search.getText()));
        area.add(tools,BorderLayout.NORTH); area.add(scroll,BorderLayout.CENTER);
        return area;
    }

    private JButton button(String text, boolean primary) {
        JButton b = new JButton(text); b.setFont(new Font("SansSerif",Font.BOLD,10));
        b.setBackground(primary ? BLACK : WHITE); b.setForeground(primary ? WHITE : BLACK);
        b.setFocusPainted(false); b.setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
        b.setBorder(new CompoundBorder(new LineBorder(primary?BLACK:new Color(215,215,215)),new EmptyBorder(10,12,10,12)));
        return b;
    }

    private DefaultTableModel model(String... columns) {
        return new DefaultTableModel(columns,0) { public boolean isCellEditable(int row,int col){return false;} };
    }

    private JTable table(DefaultTableModel m) {
        JTable t = new JTable(m); t.setRowHeight(34); t.setFont(new Font("SansSerif",Font.PLAIN,12));
        t.setForeground(BLACK); t.setBackground(WHITE); t.setGridColor(new Color(238,238,238));
        t.setSelectionBackground(BLACK); t.setSelectionForeground(WHITE);
        t.setShowVerticalLines(false); t.setFillsViewportHeight(true);
        t.getTableHeader().setFont(new Font("SansSerif",Font.BOLD,10));
        t.getTableHeader().setBackground(new Color(242,242,240)); t.getTableHeader().setForeground(BLACK);
        t.getTableHeader().setPreferredSize(new Dimension(0,38));
        return t;
    }

    private void filterTable(JTable table, String q) {
        DefaultTableModel m = (DefaultTableModel)table.getModel();
        String query=q.trim().toLowerCase();
        if(query.isEmpty()) { refreshFor(table); return; }
        // Preserve original data through database refresh, then hide non-matching rows in-place.
        refreshFor(table);
        for(int i=m.getRowCount()-1;i>=0;i--) {
            boolean match=false;
            for(int j=0;j<m.getColumnCount();j++) if(String.valueOf(m.getValueAt(i,j)).toLowerCase().contains(query)){match=true;break;}
            if(!match)m.removeRow(i);
        }
    }

    private void refreshFor(JTable t) {
        if(t==patientsTable)refreshPatients(); else if(t==doctorsTable)refreshDoctors(); else if(t==appointmentsTable)refreshAppointments(); else if(t==recordsTable)refreshRecords();
    }

    private void refreshAll(){ refreshPatients();refreshDoctors();refreshAppointments();refreshRecords();refreshDashboard(); }
    private void refreshDashboard() {
        for(Component c : content.getComponents()) if(c instanceof JPanel) findMetricLabels((Container)c);
    }
    private void findMetricLabels(Container parent) {
        for(Component c:parent.getComponents()) {
            if(c instanceof JPanel) {
                Object key=((JPanel)c).getClientProperty("metricKey");
                if(key!=null && c instanceof JPanel box) {
                    JLabel value=(JLabel)((BorderLayout)box.getLayout()).getLayoutComponent(BorderLayout.CENTER);
                    String table = key.equals("patientCount")?"patients":key.equals("doctorCount")?"doctors":"appointments";
                    try(Connection cn=connect();Statement s=cn.createStatement();ResultSet rs=s.executeQuery("SELECT COUNT(*) FROM "+table)){
                        if(rs.next())value.setText(rs.getString(1));
                    }catch(SQLException ignored){}
                }
                findMetricLabels((Container)c);
            }
        }
    }

    private void refreshPatients(){load(patientsModel,"SELECT id,name,age,gender,phone,blood_group,address FROM patients ORDER BY id DESC");}
    private void refreshDoctors(){load(doctorsModel,"SELECT id,name,specialty,phone,room FROM doctors ORDER BY id DESC");}
    private void refreshAppointments(){load(appointmentsModel,"SELECT a.id,p.name,d.name,a.visit_date,a.visit_time,a.reason,a.status FROM appointments a JOIN patients p ON p.id=a.patient_id JOIN doctors d ON d.id=a.doctor_id ORDER BY a.visit_date DESC,a.visit_time");}
    private void refreshRecords(){load(recordsModel,"SELECT m.id,p.name,m.record_date,m.diagnosis,m.treatment,m.notes FROM medical_records m JOIN patients p ON p.id=m.patient_id ORDER BY m.record_date DESC,m.id DESC");}
    private void load(DefaultTableModel m,String sql){
        if(m==null)return; m.setRowCount(0);
        try(Connection c=connect();Statement s=c.createStatement();ResultSet r=s.executeQuery(sql)){
            int n=r.getMetaData().getColumnCount(); while(r.next()){Object[] row=new Object[n];for(int i=0;i<n;i++)row[i]=r.getObject(i+1);m.addRow(row);}
        }catch(SQLException e){setStatus("DATABASE ERROR: "+e.getMessage());}
    }

    private int selectedId(JTable t) {
        int row=t.getSelectedRow(); if(row<0){showError("Select a row first.");return -1;}
        return Integer.parseInt(String.valueOf(t.getValueAt(row,0)));
    }
    private void addPatient(){patientDialog(null);}
    private void editPatient(){int id=selectedId(patientsTable);if(id>0)patientDialog(id);}
    private void patientDialog(Integer id){
        JTextField name=field(),age=field(),phone=field(),address=field();
        JComboBox<String> gender=new JComboBox<>(new String[]{"Female","Male","Non-binary","Prefer not to say"});
        JComboBox<String> blood=new JComboBox<>(new String[]{"Unknown","A+","A-","B+","B-","AB+","AB-","O+","O-"});
        if(id!=null)try(Connection c=connect();PreparedStatement p=c.prepareStatement("SELECT name,age,gender,phone,blood_group,address FROM patients WHERE id=?")){p.setInt(1,id);ResultSet r=p.executeQuery();if(r.next()){name.setText(r.getString(1));age.setText(r.getString(2));gender.setSelectedItem(r.getString(3));phone.setText(r.getString(4));blood.setSelectedItem(r.getString(5));address.setText(r.getString(6));}}catch(SQLException e){showError(e.getMessage());}
        JPanel form=formPanel(new String[]{"Full name","Age","Gender","Phone","Blood group","Address"},new JComponent[]{name,age,gender,phone,blood,address});
        if(JOptionPane.showConfirmDialog(this,form,(id==null?"Add":"Edit")+" patient",JOptionPane.OK_CANCEL_OPTION,JOptionPane.PLAIN_MESSAGE)!=JOptionPane.OK_OPTION)return;
        try{
            String nm=required(name,"Name"), ph=required(phone,"Phone"), ad=required(address,"Address");int a=Integer.parseInt(required(age,"Age"));
            if(a<0||a>120)throw new IllegalArgumentException("Age must be between 0 and 120.");
            if(!ph.matches("[0-9+() -]{7,18}"))throw new IllegalArgumentException("Enter a valid phone number.");
            String sql=id==null?"INSERT INTO patients(name,age,gender,phone,blood_group,address) VALUES(?,?,?,?,?,?)":"UPDATE patients SET name=?,age=?,gender=?,phone=?,blood_group=?,address=? WHERE id=?";
            try(Connection c=connect();PreparedStatement p=c.prepareStatement(sql)){p.setString(1,nm);p.setInt(2,a);p.setString(3,(String)gender.getSelectedItem());p.setString(4,ph);p.setString(5,(String)blood.getSelectedItem());p.setString(6,ad);if(id!=null)p.setInt(7,id);p.executeUpdate();}
            refreshAll();setStatus("PATIENT RECORD SAVED");
        }catch(Exception e){showError("Could not save patient: "+e.getMessage());}
    }
    private void deletePatient(){deleteSelected(patientsTable,"Delete this patient and their linked appointments/records?","DELETE FROM patients WHERE id=?");refreshAll();}

    private void addDoctor(){doctorDialog(null);}
    private void editDoctor(){int id=selectedId(doctorsTable);if(id>0)doctorDialog(id);}
    private void doctorDialog(Integer id){
        JTextField name=field(),specialty=field(),phone=field(),room=field();
        if(id!=null)try(Connection c=connect();PreparedStatement p=c.prepareStatement("SELECT name,specialty,phone,room FROM doctors WHERE id=?")){p.setInt(1,id);ResultSet r=p.executeQuery();if(r.next()){name.setText(r.getString(1));specialty.setText(r.getString(2));phone.setText(r.getString(3));room.setText(r.getString(4));}}catch(SQLException e){showError(e.getMessage());}
        JPanel form=formPanel(new String[]{"Full name","Specialty","Phone","Room / cabin"},new JComponent[]{name,specialty,phone,room});
        if(JOptionPane.showConfirmDialog(this,form,(id==null?"Add":"Edit")+" doctor",JOptionPane.OK_CANCEL_OPTION,JOptionPane.PLAIN_MESSAGE)!=JOptionPane.OK_OPTION)return;
        try{
            String nm=required(name,"Name"),sp=required(specialty,"Specialty"),ph=required(phone,"Phone"),rm=required(room,"Room");
            String sql=id==null?"INSERT INTO doctors(name,specialty,phone,room) VALUES(?,?,?,?)":"UPDATE doctors SET name=?,specialty=?,phone=?,room=? WHERE id=?";
            try(Connection c=connect();PreparedStatement p=c.prepareStatement(sql)){p.setString(1,nm);p.setString(2,sp);p.setString(3,ph);p.setString(4,rm);if(id!=null)p.setInt(5,id);p.executeUpdate();}
            refreshAll();setStatus("DOCTOR RECORD SAVED");
        }catch(Exception e){showError("Could not save doctor: "+e.getMessage());}
    }
    private void deleteDoctor(){deleteSelected(doctorsTable,"Delete this doctor and their linked appointments?","DELETE FROM doctors WHERE id=?");refreshAll();}

    private void addAppointment(){appointmentDialog(null);}
    private void editAppointment(){int id=selectedId(appointmentsTable);if(id>0)appointmentDialog(id);}
    private void appointmentDialog(Integer id){
        JComboBox<Choice> patient=choices("SELECT id,name FROM patients ORDER BY name");
        JComboBox<Choice> doctor=choices("SELECT id,name FROM doctors ORDER BY name");
        JTextField date=field(),time=field(),reason=field();
        date.setText(LocalDate.now().toString());time.setText(LocalTime.now().withSecond(0).withNano(0).toString());
        JComboBox<String> state=new JComboBox<>(new String[]{"Scheduled","Checked in","Completed","Cancelled"});
        if(id!=null)try(Connection c=connect();PreparedStatement p=c.prepareStatement("SELECT patient_id,doctor_id,visit_date,visit_time,reason,status FROM appointments WHERE id=?")){p.setInt(1,id);ResultSet r=p.executeQuery();if(r.next()){selectChoice(patient,r.getInt(1));selectChoice(doctor,r.getInt(2));date.setText(r.getString(3));time.setText(r.getString(4));reason.setText(r.getString(5));state.setSelectedItem(r.getString(6));}}catch(SQLException e){showError(e.getMessage());}
        if(patient.getItemCount()==0||doctor.getItemCount()==0){showError("Add at least one patient and one doctor before scheduling.");return;}
        JPanel form=formPanel(new String[]{"Patient","Doctor","Date (YYYY-MM-DD)","Time (HH:MM)","Reason","Status"},new JComponent[]{patient,doctor,date,time,reason,state});
        if(JOptionPane.showConfirmDialog(this,form,(id==null?"Schedule":"Edit")+" appointment",JOptionPane.OK_CANCEL_OPTION,JOptionPane.PLAIN_MESSAGE)!=JOptionPane.OK_OPTION)return;
        try{
            Choice pc=(Choice)patient.getSelectedItem(),dc=(Choice)doctor.getSelectedItem();
            if(pc==null||dc==null)throw new IllegalArgumentException("Choose a patient and doctor.");
            LocalDate.parse(required(date,"Date"));LocalTime.parse(required(time,"Time"));
            String why=required(reason,"Reason");
            String sql=id==null?"INSERT INTO appointments(patient_id,doctor_id,visit_date,visit_time,reason,status) VALUES(?,?,?,?,?,?)":"UPDATE appointments SET patient_id=?,doctor_id=?,visit_date=?,visit_time=?,reason=?,status=? WHERE id=?";
            try(Connection c=connect();PreparedStatement p=c.prepareStatement(sql)){p.setInt(1,pc.id);p.setInt(2,dc.id);p.setString(3,date.getText().trim());p.setString(4,time.getText().trim());p.setString(5,why);p.setString(6,(String)state.getSelectedItem());if(id!=null)p.setInt(7,id);p.executeUpdate();}
            refreshAll();setStatus("APPOINTMENT SAVED");
        }catch(Exception e){showError("Could not save appointment: "+e.getMessage());}
    }
    private void deleteAppointment(){deleteSelected(appointmentsTable,"Delete this appointment?","DELETE FROM appointments WHERE id=?");refreshAll();}

    private void addRecord(){
        JComboBox<Choice> patient=choices("SELECT id,name FROM patients ORDER BY name");
        if(patient.getItemCount()==0){showError("Add a patient before creating a medical record.");return;}
        JTextField date=field(),diagnosis=field(),treatment=field();
        JTextArea notes=new JTextArea(4,22);notes.setLineWrap(true);notes.setWrapStyleWord(true);notes.setFont(new Font("SansSerif",Font.PLAIN,13));
        date.setText(LocalDate.now().toString());
        JPanel form=formPanel(new String[]{"Patient","Record date (YYYY-MM-DD)","Diagnosis","Treatment","Notes"},new JComponent[]{patient,date,diagnosis,treatment,new JScrollPane(notes)});
        if(JOptionPane.showConfirmDialog(this,form,"Add medical record",JOptionPane.OK_CANCEL_OPTION,JOptionPane.PLAIN_MESSAGE)!=JOptionPane.OK_OPTION)return;
        try{
            Choice pc=(Choice)patient.getSelectedItem();LocalDate.parse(required(date,"Date"));
            String dg=required(diagnosis,"Diagnosis"),tr=required(treatment,"Treatment");
            try(Connection c=connect();PreparedStatement p=c.prepareStatement("INSERT INTO medical_records(patient_id,record_date,diagnosis,treatment,notes) VALUES(?,?,?,?,?)")){
                p.setInt(1,pc.id);p.setString(2,date.getText().trim());p.setString(3,dg);p.setString(4,tr);p.setString(5,notes.getText().trim());p.executeUpdate();}
            refreshAll();setStatus("MEDICAL RECORD SAVED");
        }catch(Exception e){showError("Could not save medical record: "+e.getMessage());}
    }
    private void viewRecord(){
        int id=selectedId(recordsTable);if(id<0)return;
        try(Connection c=connect();PreparedStatement p=c.prepareStatement("SELECT p.name,m.record_date,m.diagnosis,m.treatment,m.notes FROM medical_records m JOIN patients p ON p.id=m.patient_id WHERE m.id=?")){
            p.setInt(1,id);ResultSet r=p.executeQuery();if(r.next()){
                JTextArea details=new JTextArea("PATIENT   "+r.getString(1)+"\nDATE      "+r.getString(2)+"\n\nDIAGNOSIS\n"+r.getString(3)+"\n\nTREATMENT\n"+r.getString(4)+"\n\nNOTES\n"+r.getString(5));
                details.setEditable(false);details.setFont(new Font("Monospaced",Font.PLAIN,13));details.setBorder(new EmptyBorder(14,14,14,14));
                JOptionPane.showMessageDialog(this,new JScrollPane(details),"Medical record #"+id,JOptionPane.PLAIN_MESSAGE);
            }
        }catch(SQLException e){showError(e.getMessage());}
    }
    private void deleteRecord(){deleteSelected(recordsTable,"Delete this medical record?","DELETE FROM medical_records WHERE id=?");refreshAll();}

    private void deleteSelected(JTable table,String prompt,String sql){
        int id=selectedId(table);if(id<0)return;
        if(JOptionPane.showConfirmDialog(this,prompt,"Confirm deletion",JOptionPane.YES_NO_OPTION,JOptionPane.WARNING_MESSAGE)!=JOptionPane.YES_OPTION)return;
        try(Connection c=connect();PreparedStatement p=c.prepareStatement(sql)){p.setInt(1,id);p.executeUpdate();setStatus("RECORD DELETED");}
        catch(SQLException e){showError("Delete failed: "+e.getMessage());}
    }

    private JComboBox<Choice> choices(String sql){
        JComboBox<Choice> combo=new JComboBox<>();
        try(Connection c=connect();Statement s=c.createStatement();ResultSet r=s.executeQuery(sql)){while(r.next())combo.addItem(new Choice(r.getInt(1),r.getString(2)));}
        catch(SQLException e){showError(e.getMessage());}
        return combo;
    }
    private void selectChoice(JComboBox<Choice> combo,int id){for(int i=0;i<combo.getItemCount();i++)if(combo.getItemAt(i).id==id){combo.setSelectedIndex(i);return;}}
    private static class Choice {int id;String name;Choice(int i,String n){id=i;name=n;}public String toString(){return name+"  (#"+id+")";}}

    private JTextField field(){JTextField f=new JTextField(22);f.setFont(new Font("SansSerif",Font.PLAIN,13));f.setBorder(new CompoundBorder(new LineBorder(new Color(215,215,215)),new EmptyBorder(8,9,8,9)));return f;}
    private JPanel formPanel(String[] labels,JComponent[] fields){
        JPanel p=new JPanel(new GridBagLayout());p.setBackground(WHITE);p.setBorder(new EmptyBorder(8,8,8,8));GridBagConstraints g=new GridBagConstraints();g.insets=new Insets(5,5,5,5);g.fill=GridBagConstraints.HORIZONTAL;
        for(int i=0;i<labels.length;i++){g.gridx=0;g.gridy=i;g.weightx=0;JLabel l=new JLabel(labels[i]);l.setFont(new Font("SansSerif",Font.BOLD,11));p.add(l,g);g.gridx=1;g.weightx=1;p.add(fields[i],g);}
        return p;
    }
    private String required(JTextField f,String label){String s=f.getText().trim();if(s.isEmpty())throw new IllegalArgumentException(label+" is required.");return s;}
    private void showError(String msg){JOptionPane.showMessageDialog(this,msg,"BLACKWELL",JOptionPane.ERROR_MESSAGE);}
    private void setStatus(String msg){status.setText("  "+msg.toUpperCase());}
    public static void main(String[] args){
        try{UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());}catch(Exception ignored){}
        SwingUtilities.invokeLater(()->new HospitalRecordsApp().setVisible(true));
    }
}
