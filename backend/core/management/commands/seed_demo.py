from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import User
from core.models import (
    Asset,
    AuditLog,
    Company,
    Customer,
    Part,
    ServiceReport,
    Site,
    Technician,
    WorkOrder,
    WorkOrderPart,
)

# Approximate coordinates for Algerian cities.
ALGIERS = (36.753, 3.058)
ORAN = (35.699, -0.633)
CONSTANTINE = (36.365, 6.615)
SETIF = (36.191, 5.411)
ANNABA = (36.9, 7.766)
TLEMCEN = (34.882, -1.31)
BATNA = (35.555, 6.174)
BECHAR = (31.617, -2.217)


class Command(BaseCommand):
    help = "Seed the database with Algerian demo data."

    def handle(self, *args, **options):
        if User.objects.filter(username="admin").exists():
            self.stdout.write("Demo data already present.")
            return

        company = Company.objects.create(
            name="SARL Maintenance & Services Algérie",
            contact_name="Karim Benali",
            contact_email="contact@msa.dz",
            contact_phone="+213 550 12 34 56",
            address="Cité 20 Août 1956, Bab Ezzouar, Alger",
        )

        admin = User.objects.create_user(
            username="admin", email="admin@msa.dz", password="adminpass123", role="admin", is_staff=True,
            first_name="Amine", last_name="Bensalem",
        )
        manager = User.objects.create_user(
            username="manager", email="manager@msa.dz", password="managerpass123", role="manager", is_staff=True,
            first_name="Yacine", last_name="Mansouri",
        )

        customers_data = [
            ("EURL El Amel", "Amina Cherif", "contact@elamel.dz", "+213 551 11 22 33", "Rue des Frères Bouaziz, Oran"),
            ("SARL Horizon Vert", "Mohamed Larbi", "contact@horizonvert.dz", "+213 661 22 33 44", "Boulevard Abane Ramdane, Alger"),
            ("SARL Marhaba Immobilier", "Sofiane Bouzid", "contact@marhaba.dz", "+213 552 33 44 55", "Cité 5 Juillet, Constantine"),
            ("EURL Tidjani Fils", "Nassim Tidjani", "contact@tidjanifils.dz", "+213 770 44 55 66", "Zone industrielle, Sétif"),
        ]

        customers = []
        for i, (name, owner, email, phone, address) in enumerate(customers_data):
            customer = Customer.objects.create(
                company=company,
                name=name,
                email=email,
                phone=phone,
                address=address,
            )
            customer.user = User.objects.create_user(
                username=f"customer{i + 1}",
                email=email,
                password="customerpass123",
                role="customer",
                first_name=owner.split()[0],
                last_name=owner.split()[1],
            )
            customer.save()
            customers.append(customer)

        technicians_data = [
            ("Rachid", "Belkacem", "Climatisation", (36.75, 3.05)),
            ("Djamel", "Hamidi", "Électricité", (35.69, -0.63)),
            ("Saïd", "Cherif", "Plomberie", (36.36, 6.61)),
            ("Karim", "Aït Ahmed", "Énergie solaire", (31.62, -2.22)),
            ("Mehdi", "Boukhalfa", "Réseaux & IT", (36.19, 5.41)),
            ("Lamine", "Zeroual", "Sécurité & électrotechnique", (36.9, 7.77)),
        ]

        technicians = []
        for i, (first, last, specialty, coords) in enumerate(technicians_data):
            user = User.objects.create_user(
                username=f"tech{i + 1}",
                password="techpass123",
                first_name=first,
                last_name=last,
                role="technician",
            )
            tech = Technician.objects.create(
                user=user,
                specialty=specialty,
                hourly_rate=40 + i * 5,
                is_active=True,
                latitude=coords[0],
                longitude=coords[1],
            )
            technicians.append(tech)

        parts_data = [
            ("AC-SPLIT-12K", "Climatiseur split 12000 BTU", 62000, 25),
            ("CBL-3X25", "Câble électrique 3x2,5 mm² (rouleau 100 m)", 4500, 40),
            ("PMP-1CV", "Pompe à eau immergée 1 CV", 18500, 15),
            ("PV-450W", "Panneau solaire 450 W monocristallin", 34000, 20),
            ("CES-200L", "Chauffe-eau solaire 200 L", 95000, 8),
            ("GEN-5KVA", "Groupe électrogène 5 kVA", 165000, 6),
            ("TUB-PVC32", "Tuyauterie PVC Ø32 (barre 6 m)", 950, 60),
            ("COF-12MOD", "Coffret électrique 12 modules", 3200, 30),
        ]
        parts = [
            Part.objects.create(sku=sku, name=name, unit_price=unit_price, stock_qty=stock)
            for sku, name, unit_price, stock in parts_data
        ]

        site_cities = [
            (ORAN, "Zone industrielle, Es Senia, Oran"),
            (ALGIERS, "Cité El Mohammadia, Alger"),
            (CONSTANTINE, "Route de Batna, Constantine"),
            (SETIF, "Boulevard de l'ALN, Sétif"),
            (TLEMCEN, "Quartier des Oliviers, Tlemcen"),
            (ANNABA, "Cité des Orangers, Annaba"),
            (BATNA, "Avenue du 1er Novembre, Batna"),
            (BECHAR, "Nouvelle ville, Béchar"),
        ]

        asset_types = [
            ("Climatiseur mural", "CLIM-"),
            ("Groupe électrogène", "GEN-"),
            ("Chauffe-eau solaire", "CES-"),
            ("Pompe à eau", "PMP-"),
            ("Chambre froide", "CF-"),
            ("Coffret électrique", "COF-"),
            ("Panneau solaire", "PV-"),
            ("Tableau de distribution", "TAB-"),
        ]

        sites = []
        for i, customer in enumerate(customers):
            for j in range(2):
                idx = i * 2 + j
                coords, address = site_cities[idx]
                site = Site.objects.create(
                    customer=customer,
                    name=f"Établissement {customer.name.split()[-1]} {j + 1}",
                    address=address,
                    latitude=coords[0],
                    longitude=coords[1],
                )
                sites.append(site)
                asset_name, prefix = asset_types[idx]
                Asset.objects.create(
                    site=site,
                    name=asset_name,
                    asset_type=asset_name,
                    serial_number=f"{prefix}{site.id:04d}",
                )

        statuses = [
            WorkOrder.Status.NEW,
            WorkOrder.Status.ASSIGNED,
            WorkOrder.Status.ACCEPTED,
            WorkOrder.Status.IN_PROGRESS,
            WorkOrder.Status.COMPLETED,
        ]
        issue_titles = [
            "Panne de climatisation au niveau de la réception",
            "Installation d'un panneau solaire 450 W",
            "Fuite d'eau dans la salle de bain",
            "Maintenance du groupe électrogène",
            "Câblage du tableau électrique",
            "Dépannage du chauffe-eau solaire",
            "Vérification de la chambre froide",
            "Mise en service de la pompe à eau",
        ]
        for i in range(30):
            status = statuses[i % len(statuses)]
            due_at = timezone.now() + timedelta(days=(i % 7) - 3)
            work_order = WorkOrder.objects.create(
                customer=customers[i % len(customers)],
                site=sites[i % len(sites)],
                title=issue_titles[i % len(issue_titles)],
                description=f"Demande d'intervention n° {i + 1}",
                priority=["low", "medium", "high", "urgent"][i % 4],
                status=status,
                open_date=timezone.now() - timedelta(days=i % 10),
                due_at=due_at,
            )
            if status != WorkOrder.Status.NEW:
                work_order.assigned_technician = technicians[i % len(technicians)]
            if status in (WorkOrder.Status.ASSIGNED, WorkOrder.Status.ACCEPTED, WorkOrder.Status.IN_PROGRESS):
                AuditLog.objects.create(
                    work_order=work_order,
                    from_status=WorkOrder.Status.NEW,
                    to_status=WorkOrder.Status.ASSIGNED,
                    user=manager,
                    note="Affecté lors du chargement initial",
                )
                if status != WorkOrder.Status.ASSIGNED:
                    AuditLog.objects.create(
                        work_order=work_order,
                        from_status=WorkOrder.Status.ASSIGNED,
                        to_status=status,
                        user=work_order.assigned_technician.user,
                    )
            if status == WorkOrder.Status.COMPLETED:
                work_order.completed_at = work_order.open_date + timedelta(hours=3)
                work_order.resolution_minutes = 180
                work_order.save(update_fields=["completed_at", "resolution_minutes"])
                ServiceReport.objects.create(
                    work_order=work_order,
                    diagnosis="Panne identifiée sur le matériel",
                    resolution="Pièce défectueuse remplacée et essais effectués",
                    labor_hours=3.0,
                    customer_confirmation=True,
                    signature="A. Cherif",
                )
                if i % 3 == 0:
                    WorkOrderPart.objects.create(
                        work_order=work_order,
                        part=parts[i % len(parts)],
                        quantity=2,
                        unit_price=parts[i % len(parts)].unit_price,
                    )
            else:
                work_order.save()

        admin.role = "admin"
        manager.role = "manager"
        admin.save()
        manager.save()

        self.stdout.write(self.style.SUCCESS("Demo data seeded. Login with admin/adminpass123"))
