from django.core.management.base import BaseCommand
from django.db import transaction

from core.models import Company, Customer


class Command(BaseCommand):
    help = "Seed 20k customers for export comparison (uses bulk_create + generators)."

    def add_arguments(self, parser):
        parser.add_argument("--count", type=int, default=20000, help="Number of customers to create")
        parser.add_argument("--batch", type=int, default=500, help="Bulk create batch size")
        parser.add_argument("--reset", action="store_true", help="Delete existing customers before seeding")

    def handle(self, *args, **options):
        count = options["count"]
        batch = options["batch"]
        reset = options["reset"]

        if reset:
            deleted, _ = Customer.objects.filter(name__startswith="Client Demo").delete()
            self.stdout.write(f"Deleted {deleted} demo customers (Algerian linked kept)")

        company, _ = Company.objects.get_or_create(
            name="SARL Maintenance & Services Algérie",
            defaults=dict(contact_name="Karim Benali", contact_email="contact@msa.dz", contact_phone="+213 550 12 34 56", address="Cité 20 Août 1956, Bab Ezzouar, Alger"),
        )

        existing_demo = Customer.objects.filter(name__startswith="Client Demo").count()
        existing_total = Customer.objects.count()
        to_create = count - existing_demo if not reset else count
        if to_create <= 0:
            self.stdout.write(f"Already have {existing_demo} demo customers ({existing_total} total), use --reset or --count {existing_demo + count}")
            return

        self.stdout.write(f"Seeding {to_create} customers in batches of {batch} (generator + bulk_create, demo only)...")

        def gen_customers(n):
            start = existing_demo + 1 if not reset else 1
            for i in range(n):
                idx = start + i
                yield Customer(
                    company=company,
                    name=f"Client Demo {idx:05d}",
                    email=f"demo{idx:05d}@test.dz",
                    phone=f"+213 550 {idx % 10000:04d}",
                    address=f"Rue {idx} - Zone industrielle, Sétif - Lot {idx % 100}",
                )

        created = 0
        batch_buf: list[Customer] = []
        for cust in gen_customers(to_create):
            batch_buf.append(cust)
            if len(batch_buf) >= batch:
                with transaction.atomic():
                    Customer.objects.bulk_create(batch_buf, batch_size=batch)
                created += len(batch_buf)
                self.stdout.write(f"  {created}/{to_create}...")
                batch_buf = []
        if batch_buf:
            with transaction.atomic():
                Customer.objects.bulk_create(batch_buf, batch_size=batch)
            created += len(batch_buf)

        self.stdout.write(self.style.SUCCESS(f"Done. Total customers: {Customer.objects.count()} (demo {Customer.objects.filter(name__startswith='Client Demo').count()}, created {created})"))
