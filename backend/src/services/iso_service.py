import os
import yaml
import subprocess
import tempfile
import shutil
from pathlib import Path
from src.models.schemas import CloudConfig

class ISOManager:
    @staticmethod
    def generate_yaml_files(config: CloudConfig, target_dir: Path):
        # 1. meta-data
        meta_data = {
            "instance-id": config.instance_id,
            "local-hostname": config.hostname
        }
        with open(target_dir / "meta-data", "w") as f:
            yaml.dump(meta_data, f, default_flow_style=False)

        # 2. user-data
        user_data_dict = {
            "users": []
        }
        
        # Handle Global SSH Configuration
        run_commands = []
        if config.ssh_pwauth:
            user_data_dict["ssh_pwauth"] = True
            # Robust fallback for various distros (Ubuntu, AlmaLinux, etc.)
            run_commands.extend([
                "sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config",
                "echo 'PasswordAuthentication yes' > /etc/ssh/sshd_config.d/99-passwordauthentication.conf || true",
            ])
        else:
            user_data_dict["ssh_pwauth"] = False

        # Handle Root Configuration
        if config.root_enabled:
            user_data_dict["disable_root"] = False
            root_user = {
                "name": "root",
                "lock_passwd": False
            }
            if config.root_ssh_keys:
                root_user["ssh_authorized_keys"] = config.root_ssh_keys
            user_data_dict["users"].append(root_user)
            
            # Root login and password auth strategy
            run_commands.extend([
                "sed -i 's/^#*PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config",
                "echo 'PermitRootLogin yes' > /etc/ssh/sshd_config.d/99-permitrootlogin.conf || true"
            ])
            
            if config.root_ssh_pwauth:
                user_data_dict["ssh_pwauth"] = True

        if run_commands:
            # Add reload/restart at the end
            run_commands.append("systemctl restart sshd || systemctl restart ssh")
            user_data_dict["runcmd"] = run_commands

        # Regional Settings
        if config.timezone:
            user_data_dict["timezone"] = config.timezone

        # Add chpasswd
        passwords = []
        if config.root_enabled and config.root_password:
            passwords.append(f"root:{config.root_password}")
        
        for user in config.users:
            u_dict = user.model_dump(exclude={"password"})
            user_data_dict["users"].append(u_dict)
            if user.password:
                passwords.append(f"{user.name}:{user.password}")
        
        if passwords:
            user_data_dict["chpasswd"] = {
                "list": passwords,
                "expire": False
            }

        user_data_content = "#cloud-config\n" + yaml.dump(user_data_dict, default_flow_style=False)
        with open(target_dir / "user-data", "w") as f:
            f.write(user_data_content)

        # 3. network-config
        network_config = {
            "version": config.network_version,
            "ethernets": {}
        }
        for iface in config.interfaces:
            iface_dict = {"dhcp4": iface.dhcp4}
            if not iface.dhcp4:
                if iface.addresses:
                    iface_dict["addresses"] = iface.addresses
                if iface.gateway4:
                    iface_dict["gateway4"] = iface.gateway4
                if iface.nameservers:
                    iface_dict["nameservers"] = {"addresses": iface.nameservers}
            network_config["ethernets"][iface.name] = iface_dict

        with open(target_dir / "network-config", "w") as f:
            yaml.dump(network_config, f, default_flow_style=False)

    @staticmethod
    def create_iso(config: CloudConfig) -> str:
        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            ISOManager.generate_yaml_files(config, tmp_path)
            
            output_iso = f"/tmp/seed-{config.instance_id}.iso"
            
            # command: xorriso -as mkisofs -o output.iso -volid cidata -joliet -rock user-data meta-data network-config
            cmd = [
                "xorriso", "-as", "mkisofs",
                "-o", output_iso,
                "-volid", "cidata",
                "-joliet", "-rock",
                str(tmp_path / "user-data"),
                str(tmp_path / "meta-data"),
                str(tmp_path / "network-config")
            ]
            
            try:
                subprocess.run(cmd, check=True, capture_output=True)
                return output_iso
            except subprocess.CalledProcessError as e:
                print(f"Error generating ISO: {e.stderr.decode()}")
                raise Exception("Failed to generate ISO image.")
